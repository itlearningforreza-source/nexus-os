import { Server as SocketIOServer, Socket } from 'socket.io';
import { createServer, Server as HttpServer } from 'http';
import { verifyToken } from './auth';
import { getDb } from './db';

// Extend Socket with custom data
interface AuthenticatedSocket extends Socket {
  data: {
    userId: string;
    orgId: string;
    userName: string;
  };
}

let io: SocketIOServer | null = null;

/**
 * Initialize Socket.io server
 */
export function initializeSocketServer(httpServer: HttpServer): SocketIOServer {
  if (io) return io;

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const userId = await verifyToken(token as string);
      if (!userId) {
        return next(new Error('Invalid or expired token'));
      }

      // Get user info including organization
      const db = getDb();
      const user = db.prepare(
        'SELECT id, name, organization_id FROM users WHERE id = ?'
      ).get(userId) as { id: string; name: string; organization_id: string } | undefined;

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.data.userId = user.id;
      socket.data.orgId = user.organization_id;
      socket.data.userName = user.name;

      // Join organization room
      socket.join(`org:${user.organization_id}`);

      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const { userId, orgId, userName } = socket.data;
    
    console.log(`User connected: ${userName} (${userId}) to org ${orgId}`);

    // Join user's personal room for direct messages
    socket.join(`user:${userId}`);

    // Chat events
    socket.on('message:send', async (data: { conversationId: string; body: string }) => {
      try {
        const { conversationId, body } = data;
        
        // Validate conversation belongs to org
        const db = getDb();
        const conversation = db.prepare(
          'SELECT id FROM conversations WHERE id = ? AND organization_id = ?'
        ).get(conversationId, socket.data.orgId);

        if (!conversation) {
          socket.emit('error', { message: 'Conversation not found' });
          return;
        }

        // Save message to DB
        const messageId = crypto.randomUUID();
        db.prepare(
          'INSERT INTO messages (id, organization_id, conversation_id, user_id, body, created_at) VALUES (?, ?, ?, ?, ?, datetime("now"))'
        ).run(messageId, socket.data.orgId, conversationId, socket.data.userId, body);

        // Get user info for broadcast
        const user = db.prepare('SELECT id, name, avatar_color FROM users WHERE id = ?')
          .get(socket.data.userId) as { id: string; name: string; avatar_color: string };

        // Broadcast to conversation participants
        io?.to(`conversation:${conversationId}`).emit('message:new', {
          id: messageId,
          conversationId,
          userId: socket.data.userId,
          userName: user?.name,
          userAvatar: user?.avatar_color,
          body,
          createdAt: new Date().toISOString(),
        });
      } catch (error) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Join conversation room
    socket.on('conversation:join', (conversationId: string) => {
      const db = getDb();
      const conversation = db.prepare(
        'SELECT id FROM conversations WHERE id = ? AND organization_id = ?'
      ).get(conversationId, socket.data.orgId);

      if (conversation) {
        socket.join(`conversation:${conversationId}`);
        socket.emit('conversation:joined', { conversationId });
      } else {
        socket.emit('error', { message: 'Conversation not found' });
      }
    });

    // Leave conversation room
    socket.on('conversation:leave', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // Typing indicators
    socket.on('typing:start', (data: { conversationId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit('typing:start', {
        userId: socket.data.userId,
        userName: socket.data.userName,
        conversationId: data.conversationId,
      });
    });

    socket.on('typing:stop', (data: { conversationId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit('typing:stop', {
        userId: socket.data.userId,
        conversationId: data.conversationId,
      });
    });

    // Mark notification as read
    socket.on('notification:read', async (notificationId: string) => {
      try {
        const db = getDb();
        db.prepare(
          'UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?'
        ).run(notificationId, socket.data.userId);
      } catch (error) {
        // Silent fail
      }
    });

    // Mark all notifications as read
    socket.on('notification:read-all', async () => {
      try {
        const db = getDb();
        db.prepare(
          'UPDATE notifications SET read = 1 WHERE user_id = ? AND organization_id = ?'
        ).run(socket.data.userId, socket.data.orgId);
      } catch (error) {
        // Silent fail
      }
    });

    // Presence updates
    socket.on('presence:update', (status: 'online' | 'away' | 'busy' | 'offline') => {
      socket.to(`org:${socket.data.orgId}`).emit('presence:update', {
        userId: socket.data.userId,
        userName: socket.data.userName,
        status,
      });
    });

    socket.on('disconnect', (reason) => {
      console.log(`User disconnected: ${socket.data.userName} (${reason})`);
      
      // Notify others user went offline
      io?.to(`org:${socket.data.orgId}`).emit('presence:update', {
        userId: socket.data.userId,
        userName: socket.data.userName,
        status: 'offline',
      });
    });
  });

  console.log('Socket.io server initialized');
  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

/**
 * Emit event to organization room
 */
export function emitToOrg(orgId: string, event: string, data: any) {
  io?.to(`org:${orgId}`).emit(event, data);
}

/**
 * Emit event to user's personal room
 */
export function emitToUser(userId: string, event: string, data: any) {
  io?.to(`user:${userId}`).emit(event, data);
}

/**
 * Emit event to conversation room
 */
export function emitToConversation(conversationId: string, event: string, data: any) {
  io?.to(`conversation:${conversationId}`).emit(event, data);
}

/**
 * Send notification to user
 */
export async function sendNotification(
  userId: string,
  orgId: string,
  notification: { title: string; body: string; category?: string; link?: string }
) {
  try {
    const db = getDb();
    const id = crypto.randomUUID();
    
    // Save to DB
    db.prepare(
      'INSERT INTO notifications (id, organization_id, user_id, category, title, body, read, created_at) VALUES (?, ?, ?, ?, ?, 0, datetime("now"))'
    ).run(crypto.randomUUID(), orgId, userId, notification.category || 'system', notification.title, notification.body);

    // Emit real-time notification
    emitToUser(userId, 'notification:new', {
      id: crypto.randomUUID(),
      ...notification,
      createdAt: new Date().toISOString(),
      read: false,
    });
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
}

/**
 * Broadcast notification to organization
 */
export async function broadcastNotification(
  orgId: string,
  notification: { title: string; body: string; category?: string; link?: string; excludeUserId?: string }
) {
  try {
    const db = getDb();
    const users = db.prepare(
      'SELECT id FROM users WHERE organization_id = ? AND status = "active"'
    ).all(orgId) as { id: string }[];

    for (const user of users) {
      if (user.id === notification.excludeUserId) continue;
      
      const id = crypto.randomUUID();
      db.prepare(
        'INSERT INTO notifications (id, organization_id, user_id, category, title, body, read, created_at) VALUES (?, ?, ?, ?, ?, 0, datetime("now"))'
      ).run(id, orgId, user.id, notification.category || 'system', notification.title, notification.body);
    }

    // Emit to all users in org (except excluded)
    emitToOrg(orgId, 'notification:new', {
      id: crypto.randomUUID(),
      ...notification,
      createdAt: new Date().toISOString(),
      read: false,
    });
  } catch (error) {
    console.error('Failed to broadcast notification:', error);
  }
}

import crypto from 'crypto';

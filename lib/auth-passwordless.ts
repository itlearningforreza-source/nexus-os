import { createToken, verifyToken } from './auth';
import crypto from 'crypto';

const MAGIC_LINK_TTL = 15 * 60 * 1000; // 15 minutes

interface MagicLinkPayload {
  sub: string; // email
  type: 'magic-link';
  iat: number;
  exp: number;
  jti: string;
}

/**
 * Send magic link to user's email
 */
export async function sendMagicLink(
  email: string,
  options?: { redirectTo?: string; ttlMinutes?: number }
): Promise<{ token: string; link: string }> {
  const ttl = (options?.ttlMinutes || 15) * 60 * 1000;
  const expiresAt = Date.now() + ttl;
  
  const payload: MagicLinkPayload = {
    sub: email,
    type: 'magic-link',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(expiresAt / 1000),
    jti: crypto.randomUUID(),
  };
  
  const { SignJWT } = await import('jose');
  const secret = new TextEncoder().encode(process.env.AUTH_SECRET || 'dev-secret');
  
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(ttl / 1000) + 's')
    .sign(secret);
  
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const redirectTo = options?.redirectTo || '/dashboard';
  const link = `${baseUrl}/auth/verify?token=${token}&redirect=${encodeURIComponent(redirectTo)}`;
  
  // In production, send via email service (Resend, SendGrid, etc.)
  // For now, return the link for development/testing
  return { token, link };
}

/**
 * Verify magic link token
 */
export async function verifyMagicLink(token: string): Promise<{ email: string; valid: boolean } | null> {
  try {
    const { jwtVerify } = await import('jose');
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET || 'dev-secret');
    
    const { payload } = await jwtVerify(token, secret);
    
    // Verify it's a magic link token
    if ((payload as any).type !== 'magic-link') return null;
    
    // Check expiration
    const exp = (payload as any).exp * 1000;
    if (Date.now() > exp) return null;
    
    return {
      email: payload.sub as string,
      valid: true,
    };
  } catch {
    return null;
  }
}

/**
 * Generate and send magic link via email service
 * Integrate with your email provider (Resend, SendGrid, Nodemailer, etc.)
 */
export async function sendMagicLinkEmail(
  email: string,
  sendEmail: (options: { to: string; subject: string; html: string; text: string }) => Promise<void>,
  options?: { redirectTo?: string; ttlMinutes?: number }
): Promise<void> {
  const { link } = await sendMagicLink(email, options);
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 30px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Nexus OS</h1>
      </div>
      <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
        <h2 style="color: #1e293b; margin-top: 0;">Sign in to Nexus OS</h2>
        <p style="color: #475569; font-size: 16px;">
          Click the button below to securely sign in to your account. This link expires in 15 minutes.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${link}" style="display: inline-block; background: #3b82f6; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
            Sign in to Nexus OS
          </a>
        </div>
        <p style="color: #94a3b8; font-size: 14px; margin-top: 30px;">
          If you didn't request this, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
        <p style="color: #94a3b8; font-size: 12px;">
          This magic link expires in 15 minutes for security. If the button doesn't work, copy and paste this link into your browser:<br>
          <span style="word-break: break-all; color: #3b82f6;">${link}</span>
        </p>
      </div>
    </body>
    </html>
  `;
  
  const text = `
    Sign in to Nexus OS
    
    Click the link below to securely sign in to your account. This link expires in 15 minutes.
    
    ${link}
    
    If you didn't request this, you can safely ignore this email.
  `;
  
  // In production, integrate with your email service:
  // await sendEmail({ to: email, subject: 'Sign in to Nexus OS', html, text });
  
  // For development, log the link
  console.log(`[DEV] Magic link for ${email}: ${link}`);
  return link;
}

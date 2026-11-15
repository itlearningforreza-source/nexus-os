import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { ChatClient } from "./chat-client";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = getDb();
  const conversations = db
    .prepare(
      `SELECT c.*, 
        (SELECT body FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_at,
        (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND created_at > COALESCE(
          (SELECT created_at FROM notifications WHERE user_id = ? AND category = 'chat' ORDER BY created_at DESC LIMIT 1),
          '1970-01-01'
        )) as unread_count
       FROM conversations c WHERE c.organization_id = ? ORDER BY last_message_at DESC`
    )
    .all(user.id, user.organization_id) as any[];

  const users = db
    .prepare(
      "SELECT id, name, avatar_color FROM users WHERE organization_id = ? AND id != ? ORDER BY name"
    )
    .all(user.organization_id, user.id) as any[];

  return <ChatClient conversations={conversations} users={users} user={user} />;
}

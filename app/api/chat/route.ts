import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import crypto from "crypto";

export async function GET(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getDb();
  const url = new URL(req.url);
  const convId = url.searchParams.get("conversation_id");
  if (convId) {
    const conv = db
      .prepare("SELECT * FROM conversations WHERE id = ? AND organization_id = ?")
      .get(convId, user.organization_id);
    if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const messages = db
      .prepare("SELECT m.*, u.name, u.avatar_color FROM messages m JOIN users u ON u.id = m.user_id WHERE m.conversation_id = ? AND m.organization_id = ? ORDER BY m.created_at ASC LIMIT 200")
      .all(convId, user.organization_id);
    return NextResponse.json({ messages, conversation: conv });
  }
  const conversations = db
    .prepare("SELECT c.*, (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) message_count FROM conversations c WHERE c.organization_id = ? ORDER BY c.kind DESC, c.name ASC")
    .all(user.organization_id);
  return NextResponse.json({ conversations });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const db = getDb();
  const { conversation_id, body: messageBody } = body;
  if (!conversation_id || !messageBody) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  const conv = db
    .prepare("SELECT id FROM conversations WHERE id = ? AND organization_id = ?")
    .get(conversation_id, user.organization_id);
  if (!conv) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  const id = crypto.randomUUID();
  db.prepare("INSERT INTO messages (id, organization_id, conversation_id, user_id, body, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))")
    .run(id, user.organization_id, conversation_id, user.id, messageBody);
  const msg = db.prepare("SELECT m.*, u.name, u.avatar_color FROM messages m JOIN users u ON u.id = m.user_id WHERE m.id = ?").get(id);
  return NextResponse.json({ ok: true, message: msg });
}
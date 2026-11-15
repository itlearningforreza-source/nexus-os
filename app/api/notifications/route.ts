import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getDb();
  const notifications = db
    .prepare("SELECT * FROM notifications WHERE user_id = ? AND organization_id = ? ORDER BY created_at DESC LIMIT 20")
    .all(user.id, user.organization_id);
  return NextResponse.json({ notifications });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getDb();
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { id } = body || {};
  if (id) {
    db.prepare("UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ? AND organization_id = ?").run(id, user.id, user.organization_id);
  } else {
    db.prepare("UPDATE notifications SET read = 1 WHERE user_id = ? AND organization_id = ?").run(user.id, user.organization_id);
  }
  return NextResponse.json({ ok: true });
}
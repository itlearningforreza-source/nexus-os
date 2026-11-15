import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { logAudit } from "@/lib/api";
import crypto from "crypto";

const FOLDERS = ["inbox", "starred", "sent", "drafts", "archive", "trash"];

function normalizeFolder(folder: any): string {
  return FOLDERS.includes(folder) ? folder : "inbox";
}

export async function GET(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const url = new URL(req.url);
  const folder = normalizeFolder(url.searchParams.get("folder"));
  const singleId = url.searchParams.get("id");

  if (singleId) {
    const email = db
      .prepare("SELECT * FROM emails WHERE id = ? AND organization_id = ?")
      .get(singleId, user.organization_id);
    if (!email) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ email });
  }

  let sql = "SELECT * FROM emails WHERE organization_id = ?";
  const params: any[] = [user.organization_id];
  if (folder === "starred") {
    sql += " AND starred = 1";
  } else {
    sql += " AND folder = ?";
    params.push(folder);
  }
  sql += " ORDER BY created_at DESC LIMIT 200";
  const emails = db.prepare(sql).all(...params);

  return NextResponse.json({ emails });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { to, subject, body: mailBody, draft } = body || {};
  if (!subject || typeof subject !== "string" || !subject.trim()) {
    return NextResponse.json({ error: "Subject is required" }, { status: 400 });
  }

  const db = getDb();
  const id = crypto.randomUUID();
  const folder = draft ? "drafts" : "sent";
  db.prepare(
    "INSERT INTO emails (id, organization_id, folder, from_name, from_email, to_email, subject, body, read, starred, user_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, datetime('now'))"
  ).run(
    id,
    user.organization_id,
    folder,
    user.name || "Me",
    user.email || "",
    String(to || "").trim(),
    String(subject).trim(),
    String(mailBody || ""),
    user.id
  );
  logAudit(user, "Send", "email", id);
  return NextResponse.json({ ok: true, id });
}

export async function PATCH(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const db = getDb();
  const existing = db
    .prepare("SELECT id FROM emails WHERE id = ? AND organization_id = ?")
    .get(id, user.organization_id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const sets: string[] = [];
  const params: any[] = [];
  if (body.read !== undefined) { sets.push("read = ?"); params.push(body.read ? 1 : 0); }
  if (body.starred !== undefined) { sets.push("starred = ?"); params.push(body.starred ? 1 : 0); }
  if (body.folder !== undefined) { sets.push("folder = ?"); params.push(normalizeFolder(body.folder)); }
  if (sets.length === 0) return NextResponse.json({ error: "No updatable fields" }, { status: 400 });
  params.push(id, user.organization_id);

  db.prepare(`UPDATE emails SET ${sets.join(", ")} WHERE id = ? AND organization_id = ?`).run(...params);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const db = getDb();
  const result = db
    .prepare("DELETE FROM emails WHERE id = ? AND organization_id = ?")
    .run(id, user.organization_id);
  if (!result.changes) return NextResponse.json({ error: "Not found" }, { status: 404 });
  logAudit(user, "Delete", "email", id);
  return NextResponse.json({ ok: true });
}

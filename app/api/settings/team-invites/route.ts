import { NextResponse } from "next/server";
import crypto from "crypto";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit, isAdminRole } from "@/lib/api";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getDb();
  const invites = db
    .prepare("SELECT * FROM team_invites WHERE organization_id = ? AND status = 'pending' ORDER BY created_at DESC LIMIT 100")
    .all(user.organization_id);
  return NextResponse.json({ invites });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdminRole(user.role)) {
    return NextResponse.json({ error: "Only admins can invite members" }, { status: 403 });
  }
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const email = String(body?.email || "").trim().toLowerCase();
  const role = String(body?.role || "member").trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }
  if (!["owner", "admin", "manager", "member", "viewer"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }
  const db = getDb();
  // Don't invite an email that already belongs to an org member.
  const existing = db.prepare("SELECT id FROM users WHERE organization_id = ? AND email = ?").get(user.organization_id, email);
  if (existing) {
    return NextResponse.json({ error: "That email is already an org member" }, { status: 409 });
  }
  const prior = db.prepare("SELECT id FROM team_invites WHERE organization_id = ? AND email = ? AND status = 'pending'").get(user.organization_id, email);
  if (prior) {
    return NextResponse.json({ error: "An invitation to that email is already pending" }, { status: 409 });
  }
  const id = crypto.randomUUID();
  db.prepare(
    "INSERT INTO team_invites (id, organization_id, email, role, invited_by, status, created_at) VALUES (?, ?, ?, ?, ?, 'pending', datetime('now'))"
  ).run(id, user.organization_id, email, role, user.id);
  logAudit(user, "Invite", "team", id, req.headers.get("x-forwarded-for") || "");
  return NextResponse.json({ ok: true, id });
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdminRole(user.role)) {
    return NextResponse.json({ error: "Only admins can revoke invitations" }, { status: 403 });
  }
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const id = String(body?.id || "");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const db = getDb();
  const result = db.prepare("UPDATE team_invites SET status = 'revoked' WHERE id = ? AND organization_id = ?").run(id, user.organization_id);
  if (!result.changes) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
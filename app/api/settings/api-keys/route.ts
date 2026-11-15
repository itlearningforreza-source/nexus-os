import { NextResponse } from "next/server";
import crypto from "crypto";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit, isAdminRole } from "@/lib/api";

function publicKey(k: any) {
  return { id: k.id, name: k.name, key_prefix: k.key_prefix, permissions: JSON.parse(k.permissions || "[]"), created_at: k.created_at, last_used: k.last_used, revoked: k.revoked };
}

// List API keys for the org. Secrets are never returned; only masked prefixes.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getDb();
  const keys = db
    .prepare("SELECT * FROM api_keys WHERE organization_id = ? AND revoked = 0 ORDER BY created_at DESC LIMIT 100")
    .all(user.organization_id);
  return NextResponse.json({ keys: keys.map(publicKey) });
}

// Create a new API key. The full secret is returned exactly once.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdminRole(user.role)) {
    return NextResponse.json({ error: "Only admins can create API keys" }, { status: 403 });
  }
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const name = String(body?.name || "").trim().slice(0, 100);
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const perms = Array.isArray(body?.permissions) ? body.permissions.filter((p: any) => typeof p === "string") : ["read"];
  const allowed = new Set(["read", "write", "admin"]);
  const cleanPerms = perms.filter((p: string) => allowed.has(p));
  if (cleanPerms.length === 0) cleanPerms.push("read");

  const raw = crypto.randomBytes(24).toString("hex");
  const full = `nxs_${raw}`;
  const id = crypto.randomUUID();
  const db = getDb();
  db.prepare(
    "INSERT INTO api_keys (id, organization_id, name, key_prefix, secret_hash, permissions, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))"
  ).run(id, user.organization_id, name, full.slice(0, 10), crypto.createHash("sha256").update(full).toString(), JSON.stringify(cleanPerms), user.id);
  logAudit(user, "Create", "api_key", id, req.headers.get("x-forwarded-for") || "");
  return NextResponse.json({ ok: true, key: { ...publicKey(db.prepare("SELECT * FROM api_keys WHERE id = ?").get(id)), secret: full } });
}

// Revoke an API key (admin).
export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdminRole(user.role)) {
    return NextResponse.json({ error: "Only admins can revoke API keys" }, { status: 403 });
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
  const result = db.prepare("UPDATE api_keys SET revoked = 1 WHERE id = ? AND organization_id = ?").run(id, user.organization_id);
  if (!result.changes) return NextResponse.json({ error: "Not found" }, { status: 404 });
  logAudit(user, "Revoke", "api_key", id, req.headers.get("x-forwarded-for") || "");
  return NextResponse.json({ ok: true });
}
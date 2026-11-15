import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { getDb } from "@/lib/db";
import { createSession, sessionCookieName } from "@/lib/auth";
import { logAudit } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const { name, email, password, organization } = body || {};
  const db = getDb();
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const limited = rateLimit(ip, { limit: 10, windowMs: 60_000, key: "register" });
  if (!limited.allowed) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  const orgName = String(organization || "").trim();
  const userName = String(name || "").trim();
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (!userName || !normalizedEmail || !password || !orgName) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }
  if (!EMAIL_RE.test(normalizedEmail)) {
    return NextResponse.json({ error: "Please provide a valid email address" }, { status: 400 });
  }
  if (String(password).length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }
  if (String(password).length > 128) {
    return NextResponse.json({ error: "Password is too long" }, { status: 400 });
  }

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(normalizedEmail);
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  const orgId = crypto.randomUUID();
  const userId = crypto.randomUUID();
  const now = new Date().toISOString().replace("T", " ").slice(0, 19);
  const slug = (orgName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "org") + "-" + crypto.randomUUID().slice(0, 6);

  // Perform the duplicate check and inserts inside a single transaction so two
  // concurrent registrations with the same email cannot both pass the check.
  let conflict = false;
  const tx = db.transaction(() => {
    conflict = !!db.prepare("SELECT id FROM users WHERE email = ?").get(normalizedEmail);
    if (conflict) return;
    db.prepare(
      "INSERT INTO organizations (id, name, slug, industry, size, plan, settings, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'Business', '{}', ?, ?)"
    ).run(orgId, orgName, slug, "Technology", "1-10", now, now);
    db.prepare(
      "INSERT INTO users (id, organization_id, email, password_hash, name, role, title, status, onboarded, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'owner', 'Owner', 'active', 0, ?, ?)"
    ).run(userId, orgId, normalizedEmail, bcrypt.hashSync(password, 10), userName, now, now);
  });
  tx();
  if (conflict) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  const token = await createSession(userId);

  logAudit({ id: userId, organization_id: orgId }, "Register", "auth", userId, ip);

  const res = NextResponse.json({ ok: true, user: { id: userId, name: userName, email: normalizedEmail } });
  res.cookies.set(sessionCookieName(), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}

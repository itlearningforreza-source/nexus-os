import { SignJWT, jwtVerify } from "jose";
import { getDb } from "./db";
import { cookies } from "next/headers";
import crypto from "crypto";

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET || "";
  const isDefaultFallback = !secret || secret === "change-this-to-a-secure-random-string" || secret === "nexus-os-dev-secret-key-change-me";
  if (process.env.NODE_ENV === "production" && isDefaultFallback) {
    throw new Error(
      "AUTH_SECRET must be set to a strong, unique value in production. Refusing to start with a default secret."
    );
  }
  const effective = secret || "nexus-os-dev-secret-key-change-me";
  return new TextEncoder().encode(effective);
}

export async function createToken(userId: string) {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setJti(crypto.randomUUID())
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload.sub as string;
  } catch {
    return null;
  }
}

export function sessionCookieName() {
  return "nexus_token";
}

export async function createSession(userId: string) {
  const token = await createToken(userId);
  const db = getDb();
  const expires = new Date(Date.now() + SESSION_TTL_MS)
    .toISOString()
    .replace("T", " ")
    .slice(0, 19);
  db.prepare(
    "INSERT INTO sessions (id, user_id, token, created_at, expires_at) VALUES (?, ?, ?, datetime('now'), ?)"
  ).run(crypto.randomUUID(), userId, token, expires);
  return token;
}

function sessionExpired(expiresAt: string): boolean {
  if (!expiresAt) return true;
  const exp = new Date(expiresAt.replace(" ", "T") + "Z");
  return isNaN(exp.getTime()) || exp.getTime() < Date.now();
}

export async function getCurrentUser() {
  const cookieStore = cookies();
  const token = cookieStore.get(sessionCookieName())?.value;
  if (!token) return null;
  const userId = await verifyToken(token);
  if (!userId) return null;

  const db = getDb();
  // The sessions table is the source of truth for whether a token is still valid.
  // This enables logout / logout-all / password-change to revoke tokens server-side.
  const session = db
    .prepare("SELECT id, expires_at FROM sessions WHERE token = ? AND user_id = ?")
    .get(token, userId) as any;
  if (!session || sessionExpired(session.expires_at)) return null;

  const user = db
    .prepare(
      `SELECT u.*, o.name as org_name, o.slug as org_slug, o.industry, o.size, o.plan, o.settings as org_settings
       FROM users u JOIN organizations o ON o.id = u.organization_id WHERE u.id = ?`
    )
    .get(userId) as any;
  return user || null;
}

export async function requireUser() {
  return getCurrentUser();
}

export function revokeSessionByToken(token: string) {
  const db = getDb();
  db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
}

export function revokeAllSessionsForUser(userId: string, exceptToken?: string) {
  const db = getDb();
  if (exceptToken) {
    db.prepare("DELETE FROM sessions WHERE user_id = ? AND token != ?").run(userId, exceptToken);
  } else {
    db.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
  }
}

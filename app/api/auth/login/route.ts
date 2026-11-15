import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { createSession, sessionCookieName } from "@/lib/auth";
import { logAudit } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const { email, password } = body || {};
  const db = getDb();
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const limited = rateLimit(ip, { limit: 10, windowMs: 60_000, key: "login" });
  if (!limited.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      { status: 429 }
    );
  }

  const user = db
    .prepare("SELECT * FROM users WHERE email = ? AND status = 'active'")
    .get(String(email || "").toLowerCase().trim()) as any;

  if (!user || !user.password_hash || !bcrypt.compareSync(password || "", user.password_hash)) {
    if (user) {
      logAudit(user, "Login Failed", "auth", user.id, ip, "Failed");
    }
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const token = await createSession(user.id);
  logAudit(user, "Login", "auth", user.id, ip);

  const res = NextResponse.json({ ok: true, user: { id: user.id, name: user.name, email: user.email } });
  res.cookies.set(sessionCookieName(), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}

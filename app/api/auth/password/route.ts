import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { getCurrentUser, sessionCookieName, revokeAllSessionsForUser } from "@/lib/auth";
import { logAudit } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const limited = rateLimit(ip, { limit: 5, windowMs: 60_000, key: `password:${user.id}` });
  if (!limited.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { currentPassword, newPassword } = body || {};

  if (typeof newPassword !== "string" || newPassword.length < 6) {
    return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
  }
  if (newPassword.length > 128) {
    return NextResponse.json({ error: "New password is too long" }, { status: 400 });
  }
  if (typeof currentPassword !== "string" || !currentPassword) {
    return NextResponse.json({ error: "Current password is required" }, { status: 400 });
  }

  const db = getDb();
  const stored = db
    .prepare("SELECT password_hash FROM users WHERE id = ?")
    .get(user.id) as any;

  if (!stored?.password_hash || !bcrypt.compareSync(currentPassword, stored.password_hash)) {
    logAudit(user, "Password Change Failed", "auth", user.id, "", "Failed");
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
  }

  const newHash = bcrypt.hashSync(newPassword, 10);
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(newHash, user.id);

  // Revoke all other sessions so the change forces re-authentication elsewhere.
  const cookieStore = cookies();
  revokeAllSessionsForUser(user.id, cookieStore.get(sessionCookieName())?.value);

  logAudit(user, "Password Changed", "auth", user.id);
  return NextResponse.json({ ok: true });
}

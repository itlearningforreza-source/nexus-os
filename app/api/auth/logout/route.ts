import { NextResponse } from "next/server";
import { getCurrentUser, sessionCookieName, revokeSessionByToken } from "@/lib/auth";
import { logAudit } from "@/lib/api";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  const ip = req.headers.get("x-forwarded-for") || "";

  // Revoke the server-side session so the JWT can no longer be used.
  const cookieStore = cookies();
  const token = cookieStore.get(sessionCookieName())?.value;
  if (token) {
    revokeSessionByToken(token);
  }

  if (user) {
    logAudit(user, "Logout", "auth", user.id, ip);
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(sessionCookieName(), "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}

import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/api";

// Update the authenticated user's own profile fields. This is intentionally
// scoped to the user's own record (no admin elevation) and only touches a
// whitelist of personal fields, never role/organization_id/email uniqueness.
export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const db = getDb();
  const sets: string[] = [];
  const params: any[] = [];

  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (name === "") return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
    sets.push("name = ?");
    params.push(name.slice(0, 200));
  }
  if (typeof body.title === "string") {
    sets.push("title = ?");
    params.push(body.title.trim().slice(0, 120));
  }
  if (typeof body.phone === "string") {
    sets.push("phone = ?");
    params.push(body.phone.trim().slice(0, 40));
  }
  if (typeof body.timezone === "string") {
    sets.push("timezone = ?");
    params.push(body.timezone.trim().slice(0, 64));
  }
  if (typeof body.locale === "string") {
    sets.push("locale = ?");
    params.push(body.locale.trim().slice(0, 16));
  }
  if (typeof body.theme === "string" && ["system", "light", "dark"].includes(body.theme)) {
    sets.push("theme = ?");
    params.push(body.theme);
  }
  if (body.preferences && typeof body.preferences === "object" && !Array.isArray(body.preferences)) {
    sets.push("preferences = ?");
    params.push(JSON.stringify(body.preferences).slice(0, 8000));
  }

  if (sets.length === 0) {
    return NextResponse.json({ error: "No valid fields provided" }, { status: 400 });
  }

  sets.push("updated_at = datetime('now')");
  params.push(user.id);
  db.prepare(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`).run(...params);
  logAudit(user, "Update", "profile", user.id, req.headers.get("x-forwarded-for") || "");

  return NextResponse.json({ ok: true });
}
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit, isAdminRole } from "@/lib/api";

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Organization-wide settings changes are restricted to owner/admins.
  if (!isAdminRole(user.role)) {
    return NextResponse.json({ error: "You don't have permission to change organization settings" }, { status: 403 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid settings" }, { status: 400 });
  }

  const db = getDb();
  const sets: string[] = [];
  const params: any[] = [];

  const name = typeof body.name === "string" ? body.name.trim() : undefined;
  if (name !== undefined && name !== "") {
    sets.push("name = ?");
    params.push(name.slice(0, 200));
  }
  const industry = typeof body.industry === "string" ? body.industry.trim() : undefined;
  if (industry !== undefined) {
    sets.push("industry = ?");
    params.push(industry.slice(0, 120));
  }
  const size = typeof body.size === "string" ? body.size.trim() : undefined;
  if (size !== undefined) {
    sets.push("size = ?");
    params.push(size.slice(0, 40));
  }
  if (typeof body.plan === "string") {
    const plan = body.plan.trim();
    if (["Free", "Starter", "Business", "Enterprise"].includes(plan)) {
      sets.push("plan = ?");
      params.push(plan);
    } else {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }
  }

  if (sets.length === 0) {
    return NextResponse.json({ error: "No valid settings provided" }, { status: 400 });
  }

  sets.push("updated_at = datetime('now')");
  params.push(user.organization_id);

  db.prepare(`UPDATE organizations SET ${sets.join(", ")} WHERE id = ?`).run(...params);
  logAudit(user, "Update", "organization_settings", user.organization_id);

  return NextResponse.json({ ok: true });
}

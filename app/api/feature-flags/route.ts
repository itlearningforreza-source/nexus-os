import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isAdminRole, logAudit } from "@/lib/api";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getDb();
  const flags = db
    .prepare("SELECT * FROM feature_flags WHERE organization_id = ? ORDER BY name ASC")
    .all(user.organization_id);
  return NextResponse.json({ flags });
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdminRole(user.role)) {
    return NextResponse.json({ error: "You don't have permission to manage feature flags" }, { status: 403 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const flags = Array.isArray(body?.flags) ? body.flags : null;
  if (!flags) return NextResponse.json({ error: "flags array is required" }, { status: 400 });

  const db = getDb();
  const update = db.prepare(
    "UPDATE feature_flags SET enabled = ? WHERE id = ? AND organization_id = ?"
  );
  const tx = db.transaction(() => {
    for (const f of flags) {
      if (!f || typeof f.id !== "string") continue;
      const enabled = f.enabled ? 1 : 0;
      update.run(enabled, f.id, user.organization_id);
    }
  });
  tx();
  logAudit(user, "Update", "feature_flags", user.organization_id);
  return NextResponse.json({ ok: true });
}

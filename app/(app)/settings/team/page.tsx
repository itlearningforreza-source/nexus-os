import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { TeamSettingsClient } from "./team-client";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = getDb();
  const members = db
    .prepare(
      `SELECT u.id, u.name, u.email, u.role, u.title, u.avatar_color, u.status
       FROM users u WHERE u.organization_id = ? ORDER BY u.name`
    )
    .all(user.organization_id) as any[];

  return <TeamSettingsClient members={members} currentUser={user} />;
}

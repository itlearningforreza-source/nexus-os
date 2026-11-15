import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { SecuritySettingsClient } from "./security-client";

export const dynamic = "force-dynamic";

export default async function SecurityPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = getDb();
  const sessions = db
    .prepare(
      "SELECT * FROM sessions WHERE user_id = ? ORDER BY expires_at DESC LIMIT 10"
    )
    .all(user.id) as any[];

  return <SecuritySettingsClient user={user} sessions={sessions} />;
}

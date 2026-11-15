import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { AutomationClient } from "./automation-client";

export const dynamic = "force-dynamic";

export default async function AutomationPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = getDb();
  const automations = db
    .prepare(
      "SELECT * FROM automations WHERE organization_id = ? ORDER BY created_at DESC"
    )
    .all(user.organization_id) as any[];

  return <AutomationClient automations={automations} />;
}

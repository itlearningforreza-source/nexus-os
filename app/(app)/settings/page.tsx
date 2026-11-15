import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { GeneralSettingsClient } from "./general-client";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = getDb();
  const org = db
    .prepare("SELECT * FROM organizations WHERE id = ?")
    .get(user.organization_id) as any;

  return <GeneralSettingsClient org={org} user={user} />;
}

import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { isAdminRole } from "@/lib/api";
import { BillingSettingsClient } from "./billing-client";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = getDb();
  const org = db
    .prepare("SELECT * FROM organizations WHERE id = ?")
    .get(user.organization_id) as any;

  const userCount = db
    .prepare("SELECT COUNT(*) as count FROM users WHERE organization_id = ?")
    .get(user.organization_id) as any;

  const invoices = db
    .prepare(
      "SELECT * FROM invoices WHERE organization_id = ? ORDER BY created_at DESC LIMIT 5"
    )
    .all(user.organization_id) as any[];

  return (
    <BillingSettingsClient
      org={org}
      userCount={userCount?.count || 0}
      invoices={invoices}
      isAdmin={isAdminRole(user.role)}
    />
  );
}

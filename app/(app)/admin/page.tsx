import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { isAdminRole } from "@/lib/api";
import { AdminClient } from "./admin-client";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // The admin console is restricted to owner/admin roles.
  if (!isAdminRole(user.role)) redirect("/dashboard");

  const db = getDb();
  const orgId = user.organization_id;

  const org = db
    .prepare("SELECT * FROM organizations WHERE id = ?")
    .get(orgId) as any;

  const userCount = db
    .prepare("SELECT COUNT(*) as count FROM users WHERE organization_id = ?")
    .get(orgId) as any;

  const totalDeals = db
    .prepare("SELECT COUNT(*) as count FROM deals WHERE organization_id = ?")
    .get(orgId) as any;

  const totalRevenue = db
    .prepare(
      "SELECT SUM(amount) as total FROM invoices WHERE organization_id = ? AND status = 'Paid'"
    )
    .get(orgId) as any;

  const featureFlags = db
    .prepare("SELECT * FROM feature_flags WHERE organization_id = ?")
    .all(orgId) as any[];

  const auditLogs = db
    .prepare(
      `SELECT al.*, u.name as user_name FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE al.organization_id = ? ORDER BY al.created_at DESC LIMIT 20`
    )
    .all(orgId) as any[];

  return (
    <AdminClient
      org={org}
      userCount={userCount?.count || 0}
      totalDeals={totalDeals?.count || 0}
      totalRevenue={totalRevenue?.total || 0}
      featureFlags={featureFlags}
      auditLogs={auditLogs}
    />
  );
}

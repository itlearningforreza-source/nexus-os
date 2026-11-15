import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { AuditSettingsClient } from "./audit-client";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = getDb();
  const logs = db
    .prepare(
      `SELECT al.*, u.name as user_name
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE al.organization_id = ?
       ORDER BY al.created_at DESC
       LIMIT 100`
    )
    .all(user.organization_id) as any[];

  return <AuditSettingsClient logs={logs} />;
}

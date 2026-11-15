import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { SupportClient } from "./support-client";

export const dynamic = "force-dynamic";

export default async function SupportPage({ searchParams }: { searchParams: { create?: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const db = getDb();

  const tickets = db.prepare(
    `SELECT t.*, c.name company_name, u.name assignee_name, u.avatar_color
     FROM tickets t
     LEFT JOIN companies c ON c.id = t.company_id
     LEFT JOIN users u ON u.id = t.assignee_id
     WHERE t.organization_id = ? ORDER BY t.created_at DESC`
  ).all(user.organization_id) as any[];
  const counts = db.prepare(
    `SELECT
      SUM(CASE WHEN status IN ('Open','In Progress','Waiting') THEN 1 ELSE 0 END) open,
      SUM(CASE WHEN priority = 'Critical' AND status NOT IN ('Resolved','Closed') THEN 1 ELSE 0 END) critical,
      SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) resolved
     FROM tickets WHERE organization_id = ?`
  ).get(user.organization_id) as any;
  const byStatus = db.prepare("SELECT status, COUNT(*) c FROM tickets WHERE organization_id = ? GROUP BY status").all(user.organization_id) as any[];

  return <SupportClient tickets={tickets} counts={counts} byStatus={byStatus} initialCreateOpen={searchParams.create === "true"} />;
}
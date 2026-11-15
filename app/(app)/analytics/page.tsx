import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { AnalyticsClient } from "./analytics-client";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = getDb();
  const orgId = user.organization_id;

  const revenue = db
    .prepare(
      `SELECT strftime('%Y-%m', issue_date) as month, SUM(amount) as total
       FROM invoices WHERE organization_id = ? AND status = 'Paid'
       GROUP BY month ORDER BY month DESC LIMIT 12`
    )
    .all(orgId) as any[];

  const deals = db
    .prepare(
      `SELECT stage, COUNT(*) as count, SUM(value) as total_value
       FROM deals WHERE organization_id = ?
       GROUP BY stage`
    )
    .all(orgId) as any[];

  const tickets = db
    .prepare(
      `SELECT status, COUNT(*) as count
       FROM tickets WHERE organization_id = ?
       GROUP BY status`
    )
    .all(orgId) as any[];

  const projects = db
    .prepare(
      `SELECT health, COUNT(*) as count
       FROM projects WHERE organization_id = ?
       GROUP BY health`
    )
    .all(orgId) as any[];

  const employees = db
    .prepare(
      `SELECT department, COUNT(*) as count
       FROM employees WHERE organization_id = ?
       GROUP BY department ORDER BY count DESC`
    )
    .all(orgId) as any[];

  const topDeals = db
    .prepare(
      `SELECT d.title, d.value, d.stage, c.name as company_name
       FROM deals d
       LEFT JOIN companies c ON d.company_id = c.id
       WHERE d.organization_id = ?
       ORDER BY d.value DESC LIMIT 5`
    )
    .all(orgId) as any[];

  const recentInvoices = db
    .prepare(
      `SELECT number, amount, status, issue_date
       FROM invoices WHERE organization_id = ?
       ORDER BY created_at DESC LIMIT 5`
    )
    .all(orgId) as any[];

  return (
    <AnalyticsClient
      revenue={revenue.reverse()}
      deals={deals}
      tickets={tickets}
      projects={projects}
      employees={employees}
      topDeals={topDeals}
      recentInvoices={recentInvoices}
    />
  );
}

import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { FinanceClient } from "./finance-client";

export const dynamic = "force-dynamic";

export default async function FinancePage({ searchParams }: { searchParams: { create?: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const db = getDb();

  const revenue = (db.prepare("SELECT COALESCE(SUM(paid_amount),0) s FROM invoices WHERE organization_id = ? AND status = 'Paid'").get(user.organization_id) as any)?.s || 0;
  const expenses = (db.prepare("SELECT COALESCE(SUM(amount),0) s FROM expenses WHERE organization_id = ? AND status = 'Approved'").get(user.organization_id) as any)?.s || 0;
  const receivable = (db.prepare("SELECT COALESCE(SUM(amount - paid_amount),0) s FROM invoices WHERE organization_id = ? AND status IN ('Overdue','Partially Paid','Draft')").get(user.organization_id) as any)?.s || 0;
  const overdue = db.prepare("SELECT COUNT(*) c FROM invoices WHERE organization_id = ? AND status = 'Overdue'").get(user.organization_id) as any;
  const invoices = db.prepare(
    `SELECT i.*, c.name company_name FROM invoices i LEFT JOIN companies c ON c.id = i.company_id WHERE i.organization_id = ? ORDER BY i.created_at DESC`
  ).all(user.organization_id) as any[];
  const invoiceStatuses = (db.prepare("SELECT status, COUNT(*) c FROM invoices WHERE organization_id = ? GROUP BY status").all(user.organization_id) as any[]);

  const monthRevs = db.prepare(
    `SELECT strftime('%m', issue_date) m, SUM(paid_amount) v FROM invoices WHERE organization_id = ? AND status = 'Paid' AND issue_date IS NOT NULL GROUP BY m ORDER BY m`
  ).all(user.organization_id) as any[];

  return (
    <FinanceClient
      stats={{ revenue, expenses, receivable, overdue: overdue.c || 0, profit: revenue - expenses }}
      invoices={invoices}
      invoiceStatuses={invoiceStatuses}
      monthRevs={monthRevs}
      initialCreateOpen={searchParams.create === "true"}
    />
  );
}
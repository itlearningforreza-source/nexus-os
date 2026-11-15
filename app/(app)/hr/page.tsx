import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { HrClient } from "./hr-client";

export const dynamic = "force-dynamic";

export default async function HrPage({ searchParams }: { searchParams: { create?: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const db = getDb();

  const employees = db.prepare(
    "SELECT e.*, u.avatar_color FROM employees e LEFT JOIN users u ON u.id = e.user_id WHERE e.organization_id = ? ORDER BY e.name ASC"
  ).all(user.organization_id) as any[];
  const deptCounts = db.prepare("SELECT department, COUNT(*) c FROM employees WHERE organization_id = ? GROUP BY department ORDER BY c DESC").all(user.organization_id) as any[];

  return <HrClient employees={employees} deptCounts={deptCounts} initialCreateOpen={searchParams.create === "true"} />;
}
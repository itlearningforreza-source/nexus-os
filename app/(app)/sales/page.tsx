import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { SalesPipeline } from "./pipeline-client";

export const dynamic = "force-dynamic";

export default async function SalesPage({ searchParams }: { searchParams: { create?: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const db = getDb();

  const deals = db.prepare(
    `SELECT d.*, c.name company_name, CONCAT(co.first_name, ' ', co.last_name) contact_name
     FROM deals d
     LEFT JOIN companies c ON c.id = d.company_id
     LEFT JOIN contacts co ON co.id = d.contact_id
     WHERE d.organization_id = ? ORDER BY d.value DESC`
  ).all(user.organization_id) as any[];

  const users = db.prepare("SELECT id, name, avatar_color FROM users WHERE organization_id = ?").all(user.organization_id) as any[];
  const companies = db.prepare("SELECT id, name FROM companies WHERE organization_id = ? ORDER BY name").all(user.organization_id) as any[];

  return <SalesPipeline deals={deals} users={users} companies={companies} initialCreateOpen={searchParams.create === "true"} />;
}
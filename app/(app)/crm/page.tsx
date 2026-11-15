import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { CrmOverview } from "./overview-client";

export const dynamic = "force-dynamic";

export default async function CrmPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const db = getDb();

  const contacts = (db.prepare("SELECT COUNT(*) c FROM contacts WHERE organization_id = ?").get(user.organization_id) as any)?.c || 0;
  const companies = (db.prepare("SELECT COUNT(*) c FROM companies WHERE organization_id = ?").get(user.organization_id) as any)?.c || 0;
  const leads = (db.prepare("SELECT COUNT(*) c FROM contacts WHERE organization_id = ? AND status IN ('Lead','Active') AND score >= 50").get(user.organization_id) as any)?.c || 0;
  const deals = db.prepare("SELECT COUNT(*) c, COALESCE(SUM(value),0) v FROM deals WHERE organization_id = ? AND stage NOT IN ('Won','Lost')").get(user.organization_id) as any;

  const recentCompanies = (db.prepare("SELECT id, name, industry, health, annual_revenue, city FROM companies WHERE organization_id = ? ORDER BY updated_at DESC LIMIT 5").all(user.organization_id) as any[]);
  const recentContacts = (db.prepare("SELECT id, first_name, last_name, title, company_id, score, status FROM contacts WHERE organization_id = ? ORDER BY created_at DESC LIMIT 5").all(user.organization_id) as any[]);
  const topDeals = db.prepare("SELECT d.*, c.name company_name FROM deals d LEFT JOIN companies c ON c.id = d.company_id WHERE d.organization_id = ? AND d.stage NOT IN ('Won','Lost') ORDER BY d.value DESC LIMIT 5").all(user.organization_id) as any[];

  return (
    <CrmOverview
      stats={{ contacts, companies, leads, pipelineValue: deals.v, openDeals: deals.c }}
      recentCompanies={recentCompanies}
      recentContacts={recentContacts}
      topDeals={topDeals}
    />
  );
}
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { LegalClient } from "./legal-client";

export const dynamic = "force-dynamic";

export default async function LegalPage({ searchParams }: { searchParams: { create?: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const db = getDb();
  const contracts = db.prepare(
    "SELECT * FROM contracts WHERE organization_id = ? ORDER BY created_at DESC"
  ).all(user.organization_id) as any[];
  const expiring30 = contracts.filter((c) => c.expiry_date && c.status === "Active" &&
    (Date.parse(c.expiry_date) - Date.now()) < 1000 * 60 * 60 * 24 * 30);
  return <LegalClient contracts={contracts} expiringCount={expiring30.length} initialCreateOpen={searchParams.create === "true"} />;
}
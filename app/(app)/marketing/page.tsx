import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { MarketingClient } from "./marketing-client";

export const dynamic = "force-dynamic";

export default async function MarketingPage({ searchParams }: { searchParams: { create?: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const db = getDb();
  const campaigns = db.prepare("SELECT * FROM campaigns WHERE organization_id = ? ORDER BY created_at DESC").all(user.organization_id) as any[];
  return <MarketingClient campaigns={campaigns} initialCreateOpen={searchParams.create === "true"} />;
}
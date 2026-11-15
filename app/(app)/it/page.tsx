import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { ItClient } from "./it-client";

export const dynamic = "force-dynamic";

export default async function ItPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const db = getDb();
  const assets = db.prepare("SELECT * FROM assets WHERE organization_id = ? ORDER BY created_at DESC").all(user.organization_id) as any[];
  return <ItClient assets={assets} />;
}
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { DocumentsClient } from "./documents-client";

export const dynamic = "force-dynamic";

export default async function DocumentsPage({ searchParams }: { searchParams: { create?: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const db = getDb();
  const documents = db.prepare(
    `SELECT d.*, u.name owner_name FROM documents d LEFT JOIN users u ON u.id = d.owner_id WHERE d.organization_id = ? ORDER BY d.updated_at DESC`
  ).all(user.organization_id) as any[];
  return <DocumentsClient documents={documents} initialCreateOpen={searchParams.create === "true"} />;
}
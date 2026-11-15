import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { KnowledgeClient } from "./knowledge-client";

export const dynamic = "force-dynamic";

export default async function KnowledgePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = getDb();
  const pages = db
    .prepare(
      "SELECT * FROM knowledge_pages WHERE organization_id = ? ORDER BY created_at DESC"
    )
    .all(user.organization_id) as any[];

  return <KnowledgeClient pages={pages} />;
}

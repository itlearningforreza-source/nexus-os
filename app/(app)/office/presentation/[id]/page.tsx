import { getCurrentUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { PresentationEditor } from "./presentation-editor";

export const dynamic = "force-dynamic";

export default async function PresentationPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const db = getDb();
  const doc = db
    .prepare("SELECT * FROM office_documents WHERE id = ? AND organization_id = ?")
    .get(params.id, user.organization_id) as any;
  if (!doc) notFound();
  return <PresentationEditor doc={doc} />;
}
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { AiClient } from "./ai-client";

export const dynamic = "force-dynamic";

export default async function AiPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = getDb();
  const history = db
    .prepare(
      "SELECT * FROM ai_conversations WHERE user_id = ? AND organization_id = ? ORDER BY created_at ASC"
    )
    .all(user.id, user.organization_id) as any[];

  return <AiClient history={history} user={user} />;
}

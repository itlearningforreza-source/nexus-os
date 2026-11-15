import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { OfficeClient } from "./office-client";

export const dynamic = "force-dynamic";

export default async function OfficePage({
  searchParams,
}: {
  searchParams: { kind?: string; q?: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const kind = searchParams.kind;
  const allowed = ["writer", "spreadsheet", "presentation"];
  const kindFilter = kind && allowed.includes(kind) ? kind : null;
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT o.id, o.name, o.kind, o.folder, o.starred, o.archived, o.version, o.updated_at,
              u.name owner_name
       FROM office_documents o LEFT JOIN users u ON u.id = o.owner_id
       WHERE o.organization_id = ? AND o.archived = 0 ${kindFilter ? "AND o.kind = ?" : ""}
       ORDER BY o.updated_at DESC LIMIT 200`
    )
    .all(kindFilter ? [user.organization_id, kindFilter] : [user.organization_id]) as any[];
  return <OfficeClient docs={rows} initialKind={kindFilter} />;
}
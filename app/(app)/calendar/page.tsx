import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { CalendarClient } from "./calendar-client";

export const dynamic = "force-dynamic";

export default async function CalendarPage({ searchParams }: { searchParams: { create?: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = getDb();
  const events = db
    .prepare(
      "SELECT * FROM events WHERE organization_id = ? ORDER BY start ASC"
    )
    .all(user.organization_id) as any[];

  return <CalendarClient events={events} user={user} initialCreateOpen={searchParams.create === "true"} />;
}

import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { InboxClient } from "./inbox-client";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = getDb();
  const orgId = user.organization_id;

  const notifications = db
    .prepare(
      "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50"
    )
    .all(user.id) as any[];

  const recentTasks = db
    .prepare(
      `SELECT t.*, u.name as assignee_name FROM tasks t
       LEFT JOIN users u ON t.assignee_id = u.id
       WHERE t.organization_id = ? AND t.assignee_id = ?
       ORDER BY t.created_at DESC LIMIT 10`
    )
    .all(orgId, user.id) as any[];

  const recentTickets = db
    .prepare(
      `SELECT t.*, u.name as assignee_name FROM tickets t
       LEFT JOIN users u ON t.assignee_id = u.id
       WHERE t.organization_id = ? AND t.assignee_id = ?
       ORDER BY t.created_at DESC LIMIT 10`
    )
    .all(orgId, user.id) as any[];

  return (
    <InboxClient
      notifications={notifications}
      tasks={recentTasks}
      tickets={recentTickets}
    />
  );
}

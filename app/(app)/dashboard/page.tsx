import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { dashboardStats } from "@/lib/data";
import { DashboardClient } from "./dashboard-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const stats = dashboardStats(user.organization_id);
  const db = getDb();
  const userMap = db
    .prepare("SELECT id, name, avatar_color FROM users WHERE organization_id = ?")
    .all(user.organization_id) as any[];
  const userById = Object.fromEntries(userMap.map((u) => [u.id, u]));

  return (
    <DashboardClient
      user={user}
      stats={stats}
      userById={userById}
    />
  );
}
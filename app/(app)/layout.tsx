import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = getDb();
  const notifications = db
    .prepare(
      "SELECT id, title, body, category, read FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 10"
    )
    .all(user.id) as any[];

  return <AppShell user={user} notifications={notifications}>{children}</AppShell>;
}
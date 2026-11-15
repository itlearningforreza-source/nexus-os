import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { NotificationsSettingsClient } from "./notifications-client";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return <NotificationsSettingsClient user={user} />;
}

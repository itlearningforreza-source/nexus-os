import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProfileSettingsClient } from "./profile-client";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return <ProfileSettingsClient user={user} />;
}

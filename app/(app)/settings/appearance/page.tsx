import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppearanceSettingsClient } from "./appearance-client";

export const dynamic = "force-dynamic";

export default async function AppearancePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return <AppearanceSettingsClient user={user} />;
}

import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { ApiSettingsClient } from "./api-client";

export const dynamic = "force-dynamic";

export default async function ApiPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return <ApiSettingsClient user={user} />;
}

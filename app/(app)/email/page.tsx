import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EmailClient } from "./email-client";

export const dynamic = "force-dynamic";

export default async function EmailPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return <EmailClient user={user} />;
}

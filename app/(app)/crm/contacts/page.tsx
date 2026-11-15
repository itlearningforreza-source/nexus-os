import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ContactsClient } from "./contacts-client";

export const dynamic = "force-dynamic";

export default async function ContactsPage({ searchParams }: { searchParams: { create?: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <ContactsClient initialCreateOpen={searchParams.create === "true"} />;
}
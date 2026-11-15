import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ContactDetailClient } from "./contact-detail-client";

export const dynamic = "force-dynamic";

export default async function ContactDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <ContactDetailClient id={params.id} />;
}

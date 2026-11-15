import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DealDetailClient } from "./deal-detail-client";

export const dynamic = "force-dynamic";

export default async function DealDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <DealDetailClient id={params.id} />;
}

import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CompanyDetailClient } from "./company-detail-client";

export const dynamic = "force-dynamic";

export default async function CompanyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <CompanyDetailClient id={params.id} />;
}

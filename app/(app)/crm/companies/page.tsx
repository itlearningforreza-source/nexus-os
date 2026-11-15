import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CompaniesClient } from "./companies-client";

export const dynamic = "force-dynamic";

export default async function CompaniesPage({ searchParams }: { searchParams: { create?: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <CompaniesClient initialCreateOpen={searchParams.create === "true"} />;
}
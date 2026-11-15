import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProjectDetailClient } from "./project-detail-client";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <ProjectDetailClient id={params.id} />;
}

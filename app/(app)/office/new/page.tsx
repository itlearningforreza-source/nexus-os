import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { NewOfficeClient } from "./new-office-client";

export const dynamic = "force-dynamic";

export default async function NewOfficePage({
  searchParams,
}: {
  searchParams: { kind?: string; name?: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const kind = ["writer", "spreadsheet", "presentation"].includes(searchParams.kind || "")
    ? (searchParams.kind as "writer" | "spreadsheet" | "presentation")
    : "writer";
  const name = searchParams.name || "";
  return <NewOfficeClient initialKind={kind} initialName={name} />;
}
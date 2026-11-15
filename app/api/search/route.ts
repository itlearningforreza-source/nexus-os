import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { searchAll } from "@/lib/data";

export async function GET(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const q = url.searchParams.get("q") || "";
  if (!q.trim()) return NextResponse.json({ results: [] });
  const results = searchAll(user.organization_id, q.trim());
  return NextResponse.json({ results });
}
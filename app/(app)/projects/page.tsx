import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { ProjectsClient } from "./projects-client";

export const dynamic = "force-dynamic";

export default async function ProjectsPage({ searchParams }: { searchParams: { create?: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const db = getDb();

  const projects = db.prepare(
    `SELECT p.*, u.name owner_name, (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.completed = 0) open_tasks,
     (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) total_tasks
     FROM projects p LEFT JOIN users u ON u.id = p.owner_id
     WHERE p.organization_id = ? ORDER BY p.created_at DESC`
  ).all(user.organization_id) as any[];

  const users = db.prepare("SELECT id, name, avatar_color FROM users WHERE organization_id = ?").all(user.organization_id) as any[];
  const companies = db.prepare("SELECT id, name FROM companies WHERE organization_id = ? ORDER BY name").all(user.organization_id) as any[];
  const tasks = db.prepare("SELECT * FROM tasks WHERE organization_id = ? ORDER BY created_at DESC").all(user.organization_id) as any[];

  return <ProjectsClient projects={projects} users={users} companies={companies} tasks={tasks} initialCreateOpen={searchParams.create === "project"} initialTaskOpen={searchParams.create === "task"} />;
}
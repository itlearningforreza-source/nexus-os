"use client";

import * as React from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { Button, Badge } from "@/components/ui/primitive";
import { PageHeader, EmptyState, LoadingBlock } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";
import { formatDate, initials } from "@/lib/utils";

type Project = {
  id: string; name: string; description: string; status: string; health: string;
  owner_id: string; company_id: string; start_date: string; end_date: string; progress: number; created_at: string;
};
type Task = { id: string; title: string; status: string; priority: string; due_date: string; assignee_id: string; completed: number };
type Company = { id: string; name: string };

const statusTone: Record<string, string> = {
  Planning: "blue", InProgress: "blue", "In Progress": "blue", Review: "yellow", "In Review": "yellow",
  Completed: "green", Done: "green", "On Hold": "yellow", Blocked: "red", Cancelled: "neutral",
};
const priorityTone: Record<string, "red" | "yellow" | "green" | "neutral"> = {
  High: "red", Urgent: "red", Medium: "yellow", Low: "green", Normal: "neutral",
};

export function ProjectDetailClient({ id }: { id: string }) {
  const toast = useToast();
  const [project, setProject] = React.useState<Project | null>(null);
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [company, setCompany] = React.useState<Company | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`/api/projects?id=${id}`).then((r) => r.json()),
      fetch(`/api/tasks?project_id=${id}`).then((r) => r.json()),
    ])
      .then(([pd, td]) => {
        const p = pd.row || pd.rows?.[0] || null;
        setProject(p);
        setTasks(td.rows || []);
        if (p?.company_id) {
          fetch(`/api/crm/companies?id=${p.company_id}`).then((r) => r.json()).then((d) => setCompany(d.row || d.rows?.[0] || null)).catch(() => {});
        }
      })
      .catch(() => toast({ title: "Failed to load project", variant: "error" }))
      .finally(() => setLoading(false));
  }, [id, toast]);

  if (loading) return <LoadingBlock rows={6} />;
  if (!project) return <EmptyState title="Project not found" description="This project may have been deleted." />;

  const doneCount = tasks.filter((t) => t.status === "Completed" || t.completed).length;
  const pendingCount = tasks.length - doneCount;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={project.name}
        description={project.description || "Project"}
        back={`/projects`}
        actions={<Button><Icon name="edit" size={15} /> Edit</Button>}
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Badge tone={(statusTone[project.status] || "neutral") as any}>{project.status}</Badge>
        <Badge tone={project.health === "Healthy" ? "green" : project.health === "At Risk" ? "yellow" : "red"}>{project.health}</Badge>
        {company && (
          <Link href={`/crm/companies/${company.id}`} className="caption inline-flex items-center gap-1 text-accent hover:underline">
            <Icon name="building" size={13} /> {company.name}
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="card p-5">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="h3">Progress</h3>
              <span className="h3 text-accent">{project.progress}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-subtle">
              <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${project.progress}%` }} />
            </div>
            <dl className="mt-6 grid grid-cols-1 gap-4 text-[13px] sm:grid-cols-2">
              <Meta label="Start date" value={formatDate(project.start_date)} />
              <Meta label="End date" value={formatDate(project.end_date)} />
              <Meta label="Tasks completed" value={`${doneCount} / ${tasks.length}`} />
              <Meta label="Pending tasks" value={String(pendingCount)} />
            </dl>
          </div>

          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-5 py-3">
              <h3 className="h3">Tasks</h3>
              <Button size="sm"><Icon name="plus" size={14} /> New task</Button>
            </div>
            {tasks.length === 0 ? <EmptyState title="No tasks yet" /> : (
              <ul className="divide-y divide-line">
                {tasks.map((t) => (
                  <li key={t.id} className="flex items-center gap-3 px-5 py-3">
                    <span className={`h-2.5 w-2.5 flex-none rounded-full ${(priorityTone[t.priority] === "red") ? "bg-red-500" : (priorityTone[t.priority] === "yellow") ? "bg-amber-400" : (priorityTone[t.priority] === "green") ? "bg-emerald-500" : "bg-ink-faint"}`} />
                    <span className={`flex-1 text-[13px] ${t.status === "Completed" ? "text-ink-faint line-through" : "text-ink"}`}>{t.title}</span>
                    <Badge tone={(statusTone[t.status] || "neutral") as any}>{t.status}</Badge>
                    <span className="caption hidden sm:block">{formatDate(t.due_date)}</span>
                    <span className="avatar h-7 w-7 text-[11px]">{initials(t.assignee_id || "?")}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="h3 mb-4">Project info</h3>
          <dl className="space-y-3 text-[13px]">
            <Meta label="Status" value={project.status} />
            <Meta label="Health" value={project.health} />
            <Meta label="Owner" value={project.owner_id?.slice(0, 8)} />
            <Meta label="Company" value={company?.name || "—"} />
            <Meta label="Created" value={formatDate(project.created_at)} />
          </dl>
        </div>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line/60 pb-3">
      <dt className="text-ink-faint">{label}</dt>
      <dd className="text-right font-medium text-ink">{value}</dd>
    </div>
  );
}

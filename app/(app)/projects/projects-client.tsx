"use client";

import * as React from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { Button, Badge, Input, Select, Spinner } from "@/components/ui/primitive";
import { PageHeader } from "@/components/ui/page";
import { Modal } from "@/components/ui/overlay";
import { Avatar, AvatarGroup } from "@/components/ui/avatar";
import { cn, formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { KanbanBoard } from "@/components/projects/kanban";

const healthTone: Record<string, "green" | "yellow" | "red"> = { green: "green", yellow: "yellow", red: "red" };

export function ProjectsClient({ projects, users, companies, tasks, initialCreateOpen = false, initialTaskOpen = false }: any) {
  const toast = useToast();
  const [view, setView] = React.useState<"list" | "board">("list");
  const [localProjects, setLocalProjects] = React.useState(projects);
  const [localTasks, setLocalTasks] = React.useState(tasks);
  const [createOpen, setCreateOpen] = React.useState(initialCreateOpen);
  const [taskOpen, setTaskOpen] = React.useState(initialTaskOpen);
  const [saving, setSaving] = React.useState(false);
  const [savingTask, setSavingTask] = React.useState(false);
  const [form, setForm] = React.useState({ name: "", company_id: "", owner_id: "", status: "On Track", start_date: "", end_date: "" });
  const [taskForm, setTaskForm] = React.useState({ title: "", project_id: "", assignee_id: "", priority: "Medium", due_date: "", status: "Backlog" });

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, progress: 0, health: "green" }) });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      toast({ title: "Project created", variant: "success" });
      setCreateOpen(false);
      setLocalProjects((prev: any) => [...prev, { id: data.id, name: form.name, status: form.status, health: "green", progress: 0, owner_name: users.find((u: any) => u.id === form.owner_id)?.name, open_tasks: 0, total_tasks: 0 }]);
      setForm({ name: "", company_id: "", owner_id: "", status: "On Track", start_date: "", end_date: "" });
    } else toast({ title: "Failed to create project", variant: "error" });
  };

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTask(true);
    try {
      const res = await fetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...taskForm, completed: 0 }) });
      const data = await res.json();
      if (res.ok && data.id) {
        toast({ title: "Task created", variant: "success" });
        setTaskOpen(false);
        setLocalTasks((prev: any) => [{ id: data.id, ...taskForm }, ...prev]);
        setTaskForm({ title: "", project_id: "", assignee_id: "", priority: "Medium", due_date: "", status: "Backlog" });
      } else {
        toast({ title: data?.error || "Failed to create task", variant: "error" });
      }
    } catch {
      toast({ title: "Failed to create task", variant: "error" });
    } finally {
      setSavingTask(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Projects"
        description={`${localProjects.length} active initiatives`}
        actions={
          <>
            <div className="card flex items-center gap-1 p-1">
              <button onClick={() => setView("list")} className={cn("flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors", view === "list" ? "bg-subtle text-ink shadow-sm" : "text-ink-soft")}>
                <Icon name="list" size={14} /> List
              </button>
              <button onClick={() => setView("board")} className={cn("flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors", view === "board" ? "bg-subtle text-ink shadow-sm" : "text-ink-soft")}>
                <Icon name="kanban" size={14} /> Board
              </button>
            </div>
            <Button onClick={() => setCreateOpen(true)}><Icon name="plus" size={15} /> New Project</Button>
          </>
        }
      />

      {view === "list" ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {localProjects.map((p: any) => (
            <button key={p.id} onClick={() => { window.location.href = `/projects/${p.id}`; }} className="card group p-5 text-left transition-all hover:shadow-pop">
              <div className="flex items-start justify-between">
                <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", p.health === "green" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" : p.health === "yellow" ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" : "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400")}>
                  {p.status}
                </span>
                <span className="text-ink-faint opacity-0 transition-opacity group-hover:opacity-100"><Icon name="chevron-right" size={16} /></span>
              </div>
              <h3 className="mt-3 text-[15px] font-semibold text-ink">{p.name}</h3>
              <p className="mt-1 line-clamp-2 text-[13px] text-ink-soft">{p.description}</p>
              {p.owner_name && (
                <div className="mt-4 flex items-center gap-2">
                  <Avatar name={p.owner_name} size="xs" />
                  <span className="text-[12px] text-ink-faint">{p.owner_name}</span>
                </div>
              )}
              <div className="mt-4">
                <div className="mb-1 flex items-center justify-between text-[12px]">
                  <span className="text-ink-faint">{p.open_tasks} open tasks</span>
                  <span className="font-medium text-ink">{p.progress}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-subtle">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${p.progress}%` }} />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-[12px] text-ink-faint">
                <span>{p.start_date ? formatDate(p.start_date) : "—"} → {p.end_date ? formatDate(p.end_date) : "—"}</span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <KanbanBoard tasks={localTasks} users={users} onMove={async (id, status) => {
          setLocalTasks((prev: any) => prev.map((t: any) => (t.id === id ? { ...t, status } : t)));
          const res = await fetch(`/api/tasks?id=${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
          if (!res.ok) toast({ title: "Failed to update task", variant: "error" });
        }} onCreateTask={(status) => {
          setTaskForm((prev) => ({ ...prev, status }));
          setTaskOpen(true);
        }} />
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New project"
        footer={<>
          <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button onClick={create} disabled={saving}>{saving ? <Spinner /> : "Create project"}</Button>
        </>}
      >
        <form onSubmit={create} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><Input label="Project name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <Select label="Company" value={form.company_id} onChange={(e) => setForm({ ...form, company_id: e.target.value })}>
            <option value="">No company</option>
            {companies.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Select label="Owner" value={form.owner_id} onChange={(e) => setForm({ ...form, owner_id: e.target.value })}>
            <option value="">Unassigned</option>
            {users.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </Select>
          <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option>On Track</option><option>At Risk</option><option>On Hold</option><option>Completed</option>
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Start" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            <Input label="End" type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
          </div>
        </form>
      </Modal>

      <Modal
        open={taskOpen}
        onClose={() => setTaskOpen(false)}
        title="New task"
        footer={<>
          <Button variant="secondary" onClick={() => setTaskOpen(false)}>Cancel</Button>
          <Button onClick={createTask} disabled={savingTask}>{savingTask ? <Spinner /> : "Create task"}</Button>
        </>}
      >
        <form onSubmit={createTask} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><Input label="Task title" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} required /></div>
          <Select label="Project" value={taskForm.project_id} onChange={(e) => setTaskForm({ ...taskForm, project_id: e.target.value })}>
            <option value="">No project</option>
            {localProjects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
          <Select label="Assignee" value={taskForm.assignee_id} onChange={(e) => setTaskForm({ ...taskForm, assignee_id: e.target.value })}>
            <option value="">Unassigned</option>
            {users.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </Select>
          <Select label="Priority" value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}>
            <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
          </Select>
          <Select label="Status" value={taskForm.status} onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}>
            <option>Backlog</option><option>Todo</option><option>In Progress</option><option>Review</option><option>Done</option>
          </Select>
          <Input label="Due date" type="date" value={taskForm.due_date} onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })} />
        </form>
      </Modal>
    </div>
  );
}
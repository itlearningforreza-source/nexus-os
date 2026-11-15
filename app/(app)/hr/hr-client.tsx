"use client";

import * as React from "react";
import { Icon } from "@/components/ui/icon";
import { Button, Badge, Input, Select, Spinner } from "@/components/ui/primitive";
import { PageHeader } from "@/components/ui/page";
import { DataTable, type Column } from "@/components/ui/datatable";
import { Modal } from "@/components/ui/overlay";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Employee = {
  id: string; name: string; email: string; department: string; title: string;
  location: string; status: string; hire_date: string; salary: number; avatar_color?: string;
};

const statusTone: Record<string, "green" | "yellow" | "neutral"> = { Active: "green", "On Leave": "yellow", Inactive: "neutral" };

export function HrClient({ employees, deptCounts, initialCreateOpen = false }: { employees: Employee[]; deptCounts: { department: string; c: number }[]; initialCreateOpen?: boolean }) {
  const toast = useToast();
  const [rows, setRows] = React.useState<Employee[]>(employees);
  const [createOpen, setCreateOpen] = React.useState(initialCreateOpen);
  const [saving, setSaving] = React.useState(false);
  const [view, setView] = React.useState<"table" | "org">("table");
  const [form, setForm] = React.useState({ name: "", email: "", department: "Engineering", title: "Engineer", location: "Jakarta", hire_date: "", salary: 100000 });
  const depts = deptCounts.map((d) => d.department);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/hr/employees", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, status: "Active" }) });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      toast({ title: "Employee added", variant: "success" });
      setCreateOpen(false);
      setRows((prev) => [...prev, { id: data.id, ...form, status: "Active", hire_date: form.hire_date, avatar_color: "#3b82f6" }]);
    } else toast({ title: "Failed to add employee", variant: "error" });
  };

  const managerDir: Record<string, string[]> = {};
  const leadership = ["Alex Rivera", "Sarah Chen", "John Kim", "Emily Davis", "Michael Patel"];
  for (const em of rows) {
    (managerDir[em.department] = managerDir[em.department] || []).push(em.name);
  }

  const columns: Column<Employee>[] = [
    {
      key: "name", label: "Employee", sortable: true,
      render: (e) => (
        <div className="flex items-center gap-3">
          <Avatar name={e.name} color={e.avatar_color} size="sm" />
          <div>
            <p className="font-medium text-ink">{e.name}</p>
            <p className="text-[12px] text-ink-faint">{e.email}</p>
          </div>
        </div>
      ),
    },
    { key: "department", label: "Department", render: (e) => <Badge>{e.department}</Badge> },
    { key: "title", label: "Title", render: (e) => <span className="caption">{e.title}</span> },
    { key: "location", label: "Location", render: (e) => <span className="caption">{e.location}</span> },
    { key: "status", label: "Status", render: (e) => <Badge tone={statusTone[e.status] || "neutral"}>{e.status}</Badge> },
    { key: "hire_date", label: "Hired", sortable: true, render: (e) => <span className="meta">{formatDate(e.hire_date)}</span> },
    { key: "salary", label: "Salary", sortable: true, render: (e) => <span className="font-medium text-ink">{formatCurrency(e.salary)}</span> },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="People"
        description={`${rows.length} employees across ${depts.length} departments`}
        actions={
          <>
            <div className="card flex items-center gap-1 p-1">
              <button onClick={() => setView("table")} className={cn("rounded-lg px-3 py-1.5 text-[13px] font-medium", view === "table" ? "bg-subtle text-ink shadow-sm" : "text-ink-soft")}>Directory</button>
              <button onClick={() => setView("org")} className={cn("rounded-lg px-3 py-1.5 text-[13px] font-medium", view === "org" ? "bg-subtle text-ink shadow-sm" : "text-ink-soft")}>Org Chart</button>
            </div>
            <Button onClick={() => setCreateOpen(true)}><Icon name="plus" size={15} /> Add Employee</Button>
          </>
        }
      />

      {view === "table" ? (
        <DataTable
          columns={columns}
          rows={rows}
          searchPlaceholder="Search employees…"
          onSearch={(q) => setRows(rows.filter((e) => e.name.toLowerCase().includes(q.toLowerCase()) || e.title.toLowerCase().includes(q.toLowerCase()) || e.department.toLowerCase().includes(q.toLowerCase())))}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {depts.map((dept) => {
            const team = rows.filter((r) => r.department === dept);
            const managers = team.filter((r) => leadership.includes(r.name));
            const members = team.filter((r) => !leadership.includes(r.name));
            return (
              <div key={dept} className="card p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="h3">{dept}</h3>
                  <Badge>{team.length}</Badge>
                </div>
                <p className="meta mb-2 uppercase tracking-wide">Leadership</p>
                <div className="space-y-2">
                  {managers.map((m) => (
                    <div key={m.id} className="flex items-center gap-2.5">
                      <Avatar name={m.name} color={m.avatar_color} size="sm" />
                      <div>
                        <p className="text-[13px] font-medium text-ink">{m.name}</p>
                        <p className="text-[11px] text-ink-faint">{m.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="meta mb-2 mt-4 uppercase tracking-wide">Members</p>
                <div className="flex flex-wrap gap-2">
                  {members.slice(0, 8).map((m) => (
                    <span key={m.id} title={m.name}>
                      <Avatar name={m.name} color={m.avatar_color} size="sm" />
                    </span>
                  ))}
                  {members.length > 8 && (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-subtle text-[11px] font-medium text-ink-soft">
                      +{members.length - 8}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add employee"
        footer={<>
          <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button onClick={create} disabled={saving}>{saving ? <Spinner /> : "Add employee"}</Button>
        </>}
      >
        <form onSubmit={create} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Select label="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
            {depts.map((d) => <option key={d}>{d}</option>)}
          </Select>
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input label="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <Input label="Hire date" type="date" value={form.hire_date} onChange={(e) => setForm({ ...form, hire_date: e.target.value })} />
          <Input label="Salary (USD)" type="number" value={form.salary} onChange={(e) => setForm({ ...form, salary: Number(e.target.value) })} />
        </form>
      </Modal>
    </div>
  );
}
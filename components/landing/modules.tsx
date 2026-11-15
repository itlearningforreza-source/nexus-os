"use client";

import * as React from "react";

const modules = [
  {
    id: "crm",
    label: "CRM & Sales",
    description:
      "Full CRM with contacts, companies, leads, and a visual sales pipeline. Track every deal from first touch to closed won.",
    stats: "100+ contacts, drag-and-drop deals, lead scoring",
    color: "from-blue-500/10 to-blue-600/5",
  },
  {
    id: "projects",
    label: "Projects & Tasks",
    description:
      "Kanban boards, list views, task assignments, due dates, and project timelines. Keep your team aligned and productive.",
    stats: "Kanban boards, task tracking, project health",
    color: "from-purple-500/10 to-purple-600/5",
  },
  {
    id: "finance",
    label: "Finance & Invoicing",
    description:
      "Create invoices, track expenses, monitor revenue, and get a real-time view of your financial health.",
    stats: "Invoice management, expense tracking, revenue charts",
    color: "from-emerald-500/10 to-emerald-600/5",
  },
  {
    id: "hr",
    label: "HR & People",
    description:
      "Employee directory, org chart, department management. Manage your people with clarity.",
    stats: "Org chart, employee directory, departments",
    color: "from-amber-500/10 to-amber-600/5",
  },
  {
    id: "docs",
    label: "Documents & Knowledge",
    description:
      "Upload, organize, and share documents. Build a knowledge base that your team actually uses.",
    stats: "File management, wiki, shared folders",
    color: "from-rose-500/10 to-rose-600/5",
  },
  {
    id: "ai",
    label: "AI Assistant",
    description:
      "Built-in AI that understands your business data. Ask questions, get insights, and automate routine tasks.",
    stats: "Natural language queries, smart insights, automation",
    color: "from-cyan-500/10 to-cyan-600/5",
  },
];

export function Modules() {
  const [active, setActive] = React.useState("crm");
  const activeModule = modules.find((m) => m.id === active)!;

  return (
    <section id="modules" className="py-24 sm:py-32 bg-canvas-subtle">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">
            Product
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Every module, one experience
          </h2>
          <p className="mt-4 text-lg text-ink-soft">
            CRM, HR, Finance, Projects, Documents, and AI — all designed with
            the same UI, the same data layer, the same search.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-4xl">
          <div className="flex flex-wrap justify-center gap-2">
            {modules.map((m) => (
              <button
                key={m.id}
                onClick={() => setActive(m.id)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  active === m.id
                    ? "bg-accent text-white shadow-sm"
                    : "bg-canvas-raised text-ink-soft border border-line hover:text-ink hover:border-line-strong"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div
            className={`mt-8 rounded-2xl border border-line bg-gradient-to-br ${activeModule.color} p-8 sm:p-12 transition-all`}
          >
            <h3 className="text-2xl font-bold">{activeModule.label}</h3>
            <p className="mt-3 max-w-xl text-ink-soft leading-relaxed">
              {activeModule.description}
            </p>
            <p className="mt-4 text-sm font-medium text-accent">
              {activeModule.stats}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

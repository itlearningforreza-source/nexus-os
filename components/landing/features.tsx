import * as React from "react";

const features = [
  {
    icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2",
    circle: "M23 21v-2a4 4 0 0 0-3-3.87",
    line1: "M16 3.13a4 4 0 0 1 0 7.75",
    title: "Unified CRM",
    description:
      "Manage contacts, companies, deals, and pipelines in one place. Never lose track of a lead again.",
  },
  {
    icon: "M12 20h9",
    circle: "M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z",
    title: "Project Management",
    description:
      "Kanban boards, Gantt charts, sprints, and milestones. Ship projects on time, every time.",
  },
  {
    icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z",
    line1: "M14 2v6h6",
    line2: "M16 13H8",
    line3: "M16 17H8",
    line4: "M10 9H8",
    title: "Documents & Knowledge",
    description:
      "Store, share, and collaborate on documents. Build a company wiki that everyone actually uses.",
  },
  {
    icon: "M12 1v22",
    line1: "M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
    title: "Finance & Invoicing",
    description:
      "Track revenue, expenses, and invoices. Get real-time financial visibility across your organization.",
  },
  {
    icon: "M22 12h-4l-3 9L9 3l-3 9H2",
    title: "Analytics & Reporting",
    description:
      "Beautiful dashboards and reports. Make data-driven decisions with real-time insights.",
  },
  {
    icon: "M12 2a10 10 0 1 0 10 10H12V2z",
    line1: "M20.46 9A10 10 0 0 0 12 2v10h8.46",
    title: "AI-Powered",
    description:
      "Built-in AI assistant that understands your business. Analyze data, draft emails, and automate tasks.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">
            Features
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            One platform to run it all
          </h2>
          <p className="mt-4 text-lg text-ink-soft">
            Stop switching between 20+ tools. Nexus OS brings everything
            together in a single, cohesive workspace.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group relative overflow-hidden rounded-2xl border border-line bg-canvas-raised p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-pop"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-accent-subtle transition-colors group-hover:bg-accent-soft">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-accent"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d={f.icon} />
                  {f.line1 && <path d={f.line1} />}
                  {f.line2 && <path d={f.line2} />}
                  {f.line3 && <path d={f.line3} />}
                  {f.line4 && <path d={f.line4} />}
                </svg>
              </div>
              <h3 className="text-base font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--accent-subtle),transparent_65%)] opacity-40" />
      </div>

      <div className="mx-auto max-w-6xl px-6 text-center">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-canvas-raised px-4 py-1.5 text-xs font-medium text-ink-soft shadow-card">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          Now in Open Beta
          <span className="text-ink-faint">·</span>
          SOC 2 ready
        </div>

        <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Your entire company in
          <br />
          <span className="bg-gradient-to-r from-accent to-purple-500 bg-clip-text text-transparent">
            one operating system.
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-ink-soft">
          CRM, projects, finance, HR, documents, and AI — unified on a single,
          secure platform. Replace a dozen disconnected tools with the workspace
          your team actually wants to live in.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/register"
            className="rounded-xl bg-accent px-7 py-3 text-sm font-semibold text-white shadow-md transition-all hover:brightness-110 hover:shadow-lg"
          >
            Start Free Trial
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-line bg-canvas-raised px-7 py-3 text-sm font-semibold text-ink transition-all hover:bg-subtle"
          >
            Book a Demo
          </Link>
        </div>

        <div className="mx-auto mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[13px] text-ink-faint">
          {["No credit card required", "Free 14-day trial", "Cancel anytime"].map((item) => (
            <span key={item} className="flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {item}
            </span>
          ))}
        </div>

        <div className="mx-auto mt-14 max-w-5xl overflow-hidden rounded-2xl border border-line bg-canvas-raised shadow-overlay">
          <div className="flex items-center gap-2 border-b border-line bg-canvas-subtle/60 px-4 py-3">
            <span className="h-3 w-3 rounded-full bg-zinc-200 dark:bg-zinc-700" />
            <span className="h-3 w-3 rounded-full bg-zinc-200 dark:bg-zinc-700" />
            <span className="h-3 w-3 rounded-full bg-zinc-200 dark:bg-zinc-700" />
            <span className="ml-4 text-xs text-ink-faint">
              nexus-os.app/dashboard
            </span>
          </div>
          <div className="bg-canvas-subtle p-8 sm:p-12">
            <DashboardPreview />
          </div>
        </div>
      </div>
    </section>
  );
}

function DashboardPreview() {
  return (
    <div className="grid grid-cols-4 gap-4">
      {[
        { label: "Revenue", value: "$1.82M", change: "+18.4%", color: "emerald" },
        { label: "Pipeline", value: "$4.62M", change: "+12.1%", color: "blue" },
        { label: "Projects", value: "28", change: "4 at risk", color: "amber" },
        { label: "Tickets", value: "84", change: "-12%", color: "emerald" },
      ].map((kpi) => (
        <div
          key={kpi.label}
          className="rounded-xl border border-line bg-canvas-raised p-4"
        >
          <p className="text-xs text-ink-faint">{kpi.label}</p>
          <p className="mt-1 text-xl font-bold tracking-tight">{kpi.value}</p>
          <span
            className={`mt-1 inline-block rounded-md px-1.5 py-0.5 text-[11px] font-medium ${
              kpi.color === "emerald"
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                : kpi.color === "amber"
                  ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                  : "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
            }`}
          >
            {kpi.change}
          </span>
        </div>
      ))}
      <div className="col-span-4 mt-2 grid grid-cols-3 gap-4">
        <div className="col-span-2 rounded-xl border border-line bg-canvas-raised p-5">
          <p className="text-sm font-semibold">Revenue Trend</p>
          <div className="mt-4 flex items-end gap-1.5">
            {[40, 55, 45, 65, 50, 70, 60, 80, 75, 90, 85, 95].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-accent/20"
                style={{ height: `${h * 0.6}px` }}
              />
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-ink-faint">
            <span>Jan</span>
            <span>Jun</span>
            <span>Dec</span>
          </div>
        </div>
        <div className="rounded-xl border border-line bg-canvas-raised p-5">
          <p className="text-sm font-semibold">Pipeline</p>
          <div className="mt-4 space-y-3">
            {[
              { label: "Won", w: "85%", color: "bg-emerald-500" },
              { label: "Negotiation", w: "65%", color: "bg-blue-500" },
              { label: "Proposal", w: "50%", color: "bg-amber-500" },
              { label: "Qualified", w: "35%", color: "bg-purple-500" },
            ].map((s) => (
              <div key={s.label}>
                <div className="flex justify-between text-[11px]">
                  <span className="text-ink-soft">{s.label}</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className={`h-full rounded-full ${s.color}`}
                    style={{ width: s.w }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

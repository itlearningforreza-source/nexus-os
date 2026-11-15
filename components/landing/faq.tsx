"use client";

import * as React from "react";

const faqs = [
  {
    q: "What is Nexus OS?",
    a: "Nexus OS is an all-in-one company operating system that unifies CRM, projects, finance, HR, documents, AI, and more into a single platform. Replace 20+ tools with one workspace.",
  },
  {
    q: "How many users can I add?",
    a: "The Starter plan supports up to 5 users for free. Business and Enterprise plans support unlimited users.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes. The Starter plan is free forever. Business and Enterprise plans come with a 14-day free trial — no credit card required.",
  },
  {
    q: "Can I import data from other tools?",
    a: "Yes. Nexus OS supports importing contacts, companies, deals, tasks, and documents from CSV files. We also offer guided migration from popular platforms.",
  },
  {
    q: "Is my data secure?",
    a: "Absolutely. We use industry-standard encryption, isolated multi-tenant architecture, and regular security audits. Your data is always yours.",
  },
  {
    q: "Can I customize the platform?",
    a: "Yes. You can enable/disable modules, customize dashboards, create automation workflows, and configure roles and permissions to match your organization.",
  },
  {
    q: "Do you offer support?",
    a: "Starter plans get community support. Business plans include priority email support. Enterprise plans get dedicated support with an SLA guarantee.",
  },
  {
    q: "What about the AI features?",
    a: "The built-in AI assistant can analyze your business data, answer questions about your CRM, finance, and projects, and help automate routine tasks. It's included in Business and Enterprise plans.",
  },
];

export function FAQ() {
  const [open, setOpen] = React.useState<number | null>(null);

  return (
    <section id="faq" className="py-24 sm:py-32 bg-canvas-subtle">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">
            FAQ
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Frequently asked questions
          </h2>
        </div>

        <div className="mt-12 space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="rounded-xl border border-line bg-canvas-raised overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between px-6 py-4 text-left text-sm font-medium transition-colors hover:bg-subtle"
              >
                {faq.q}
                <svg
                  className={`h-4 w-4 shrink-0 text-ink-faint transition-transform ${
                    open === i ? "rotate-180" : ""
                  }`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {open === i && (
                <div className="px-6 pb-4 text-sm leading-relaxed text-ink-soft">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

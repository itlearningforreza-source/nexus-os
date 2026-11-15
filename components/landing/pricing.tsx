import * as React from "react";
import Link from "next/link";

const plans = [
  {
    name: "Starter",
    price: "Free",
    period: "forever",
    description: "Perfect for small teams getting started.",
    features: [
      "Up to 5 users",
      "1 GB storage",
      "CRM",
      "Projects",
      "Documents",
      "Basic analytics",
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Business",
    price: "$29",
    period: "/user/month",
    description: "For growing teams that need more power.",
    features: [
      "Unlimited users",
      "50 GB storage",
      "All Starter features",
      "Finance & Invoicing",
      "HR & People",
      "Support tickets",
      "AI Assistant",
      "Automations",
      "Advanced analytics",
      "Priority support",
    ],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large organizations with custom needs.",
    features: [
      "Everything in Business",
      "Unlimited storage",
      "SSO & SAML",
      "Custom roles & permissions",
      "Advanced security",
      "Dedicated support",
      "Custom integrations",
      "SLA guarantee",
      "On-premise option",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">
            Pricing
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-ink-soft">
            Start free. Upgrade when you need more. No hidden fees.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl items-stretch gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border p-8 transition-all duration-200 ${
                plan.highlighted
                  ? "border-accent bg-canvas-raised shadow-pop lg:-translate-y-3 lg:scale-[1.03]"
                  : "border-line bg-canvas-raised hover:border-line-strong"
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white shadow-sm">
                  Most Popular
                </span>
              )}
              <h3 className="text-lg font-bold">{plan.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight">
                  {plan.price}
                </span>
                {plan.period && (
                  <span className="text-sm text-ink-faint">{plan.period}</span>
                )}
              </div>
              <p className="mt-2 text-sm text-ink-soft">{plan.description}</p>
              <Link
                href="/register"
                className={`mt-6 block w-full rounded-lg py-2.5 text-center text-sm font-semibold transition-all ${
                  plan.highlighted
                    ? "bg-accent text-white hover:brightness-110"
                    : "border border-line bg-canvas-subtle text-ink hover:bg-subtle"
                }`}
              >
                {plan.cta}
              </Link>
              <ul className="mt-8 space-y-3 border-t border-line pt-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-ink-soft">
                    <svg
                      className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

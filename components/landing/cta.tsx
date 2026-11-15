import * as React from "react";
import Link from "next/link";

export function CTA() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="relative overflow-hidden rounded-3xl border border-line bg-canvas-raised px-8 py-16 text-center shadow-pop sm:px-16">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
            <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl" />
          </div>
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">
            Get started today
          </p>
          <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
            Run your entire business on one platform.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-ink-soft">
            Join teams replacing a dozen tools with Nexus OS. Set up in minutes,
            scale without limits.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="rounded-xl bg-accent px-7 py-3 text-sm font-semibold text-white shadow-md transition-all hover:brightness-110 hover:shadow-lg"
            >
              Start Free Trial
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-line bg-canvas px-7 py-3 text-sm font-semibold text-ink transition-all hover:bg-subtle"
            >
              Book a Demo
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
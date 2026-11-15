"use client";

import * as React from "react";
import Link from "next/link";

export function LandingNavbar() {
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-line bg-canvas/80 backdrop-blur-xl shadow-card"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-accent text-white shadow-sm">
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="text-lg font-semibold tracking-tight">Nexus OS</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <a
            href="#features"
            className="text-sm text-ink-soft transition-colors hover:text-ink"
          >
            Features
          </a>
          <a
            href="#modules"
            className="text-sm text-ink-soft transition-colors hover:text-ink"
          >
            Product
          </a>
          <a
            href="#pricing"
            className="text-sm text-ink-soft transition-colors hover:text-ink"
          >
            Pricing
          </a>
          <a
            href="#faq"
            className="text-sm text-ink-soft transition-colors hover:text-ink"
          >
            FAQ
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden text-sm font-medium text-ink-soft transition-colors hover:text-ink sm:block"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:brightness-110"
          >
            Start Free
          </Link>
        </div>
      </div>
    </header>
  );
}

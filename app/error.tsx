"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-500/10">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      </div>
      <h2 className="mt-5 text-xl font-semibold text-ink">Something went wrong</h2>
      <p className="mt-2 max-w-md text-sm text-ink-soft">
        An unexpected error occurred. Please try again or return to the dashboard.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
        >
          Try again
        </button>
        <a
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-subtle"
        >
          Dashboard
        </a>
      </div>
    </div>
  );
}

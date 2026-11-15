export default function AppLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-accent" />
        <p className="text-sm text-ink-faint">Loading Nexus OS...</p>
      </div>
    </div>
  );
}

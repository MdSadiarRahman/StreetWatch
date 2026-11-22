export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
      <div className="max-w-md rounded-2xl border border-border bg-surface p-8 shadow-subtle">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-brand">
          🛡️
        </div>
        <h1 className="text-2xl font-bold text-slate-900">StreetWatch</h1>
        <p className="mt-2 text-sm text-slate-600">
          Autonomous Civic Issue Reporting & AI Prioritization Platform
        </p>
        <div className="mt-6 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-status-resolved border border-status-resolvedBorder">
          System Initialized &bull; Ready for Step 4
        </div>
      </div>
    </main>
  );
}

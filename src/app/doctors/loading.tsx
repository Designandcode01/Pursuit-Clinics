export default function DoctorsLoading() {
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-10 lg:px-10">
      <div className="h-4 w-24 animate-pulse rounded bg-[var(--surface-raised)]" />
      <div className="mt-10 h-12 w-64 animate-pulse rounded bg-[var(--surface-raised)]" />
      <div className="mt-8 h-24 animate-pulse rounded-2xl bg-[var(--surface)]" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3, 4, 5, 6].map((item) => <div key={item} className="h-72 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--surface)]" />)}</div>
    </main>
  );
}

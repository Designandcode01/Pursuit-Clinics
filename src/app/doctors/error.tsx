"use client";

export default function DoctorsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto grid min-h-[60vh] max-w-3xl place-items-center px-6 py-16 text-center">
      <section><p className="text-sm text-[var(--danger)]">Directory unavailable</p><h1 className="mt-2 text-3xl font-medium">The doctor directory did not load</h1><p className="mt-3 text-[var(--muted)]">Please try again in a moment.</p><button onClick={reset} className="mt-6 rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-[#071411]">Try again</button></section>
    </main>
  );
}

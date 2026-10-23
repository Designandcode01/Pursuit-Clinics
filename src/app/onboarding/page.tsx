import Link from "next/link";
import { Suspense } from "react";
import { requireAppUser } from "@/lib/auth/user";

async function SyncedAccount() {
  const user = await requireAppUser();

  return (
    <section className="w-full max-w-xl rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 sm:p-10">
      <span className="grid size-12 place-items-center rounded-2xl bg-[#193a34] text-xl text-[var(--primary)]">✓</span>
      <p className="mt-7 text-sm text-[var(--primary)]">Account setup</p>
      <h1 className="mt-2 text-3xl font-medium tracking-tight">Welcome, {user.name}</h1>
      <p className="mt-4 leading-7 text-[var(--muted)]">Your account is securely connected and ready. Your current access level is <span className="font-medium text-white">{user.role.toLowerCase()}</span>.</p>
      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">New accounts start as patients. Doctor and administrator access can only be assigned through trusted administration.</p>
      <Link href="/" className="mt-8 inline-flex rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-[#071411] transition hover:bg-[var(--primary-strong)]">Continue to Pursuit Clinics</Link>
    </section>
  );
}

export default function OnboardingPage() {
  return (
    <main className="grid min-h-screen place-items-center px-5 py-12">
      <Suspense fallback={<div className="h-80 w-full max-w-xl animate-pulse rounded-3xl border border-[var(--border)] bg-[var(--surface)]" />}>
        <SyncedAccount />
      </Suspense>
    </main>
  );
}

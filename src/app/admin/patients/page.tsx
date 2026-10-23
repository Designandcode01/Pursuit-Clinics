import { Suspense } from "react";
import { AppointmentTime } from "@/components/appointments/appointment-time";
import { AdminNav } from "@/components/layout/admin-nav";
import { getAdminPatients } from "@/features/admin/queries";
import { requireRole } from "@/lib/auth/user";

type SearchParams = Promise<{ q?: string }>;
async function PatientsAdminContent({ searchParams }: { searchParams: SearchParams }) {
  await requireRole("ADMIN");
  const params = await searchParams;
  const query = params.q?.trim().slice(0, 100) ?? "";
  const patients = await getAdminPatients(query);
  return <><AdminNav /><main className="mx-auto min-h-screen max-w-7xl px-6 py-8 lg:px-10"><p className="text-sm text-[var(--primary)]">Account administration</p><h1 className="mt-2 text-3xl font-medium tracking-tight">Patients</h1><p className="mt-2 text-sm text-[var(--muted)]">Search patient accounts and review their registration details.</p><form action="/admin/patients" className="mt-6 flex gap-2"><input name="q" defaultValue={query} placeholder="Search name or email" className="min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)]" /><button className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm">Search</button></form>
    {patients.length ? <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">{patients.map((patient) => <article key={patient.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] p-4 last:border-0"><div><p className="font-medium">{patient.name}</p><p className="mt-1 text-sm text-[var(--muted)]">{patient.email}</p></div><p className="text-xs text-[var(--muted)]">Joined <AppointmentTime startAt={patient.createdAt.toISOString()} /></p></article>)}</div> : <p className="mt-6 rounded-2xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--muted)]">No patients match this search.</p>}
  </main></>;
}
export default function AdminPatientsPage({ searchParams }: { searchParams: SearchParams }) { return <Suspense fallback={<main className="min-h-screen animate-pulse bg-[var(--background)]" />}><PatientsAdminContent searchParams={searchParams} /></Suspense>; }

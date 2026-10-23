import { Suspense } from "react";
import Link from "next/link";
import { AdminDoctorForm, DoctorActiveToggle } from "@/components/admin/doctor-forms";
import { AdminNav } from "@/components/layout/admin-nav";
import { formatConsultationFee } from "@/lib/format";
import { getAdminDoctors } from "@/features/admin/queries";
import { getStoredSpecialties } from "@/features/doctors/queries";
import { requireRole } from "@/lib/auth/user";

type SearchParams = Promise<{ q?: string }>;
async function DoctorsAdminContent({ searchParams }: { searchParams: SearchParams }) {
  await requireRole("ADMIN");
  const params = await searchParams;
  const query = params.q?.trim().slice(0, 100) ?? "";
  const [doctors, specialties] = await Promise.all([getAdminDoctors(query), getStoredSpecialties()]);
  return <><AdminNav /><main className="mx-auto min-h-screen max-w-7xl px-6 py-8 lg:px-10"><p className="text-sm text-[var(--primary)]">Directory administration</p><h1 className="mt-2 text-3xl font-medium tracking-tight">Doctors</h1><p className="mt-2 text-sm text-[var(--muted)]">Assign real Clerk accounts to doctor profiles, manage directory visibility, and set visit fees and scheduling defaults. Add the account’s specialty before creating its provider profile.</p><Link href="/admin/specialties" className="mt-3 inline-flex text-sm text-[var(--primary)] hover:underline">Add or manage specialties →</Link>
    <form action="/admin/doctors" className="mt-6 flex gap-2"><input name="q" defaultValue={query} placeholder="Search name, email, or specialty" className="min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)]" /><button className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm">Search</button></form>
    <section className="mt-7"><h2 className="mb-3 text-xl font-medium">Create or update a provider</h2><AdminDoctorForm specialties={specialties} /></section>
    <section className="mt-10"><h2 className="text-xl font-medium">Provider profiles</h2>{doctors.length ? <div className="mt-4 grid gap-4">{doctors.map((doctor) => <article key={doctor.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-medium">{doctor.displayName}</p><p className="mt-1 text-xs text-[var(--muted)]">{doctor.email} · {doctor.specialtyName} · {formatConsultationFee(doctor.fee)} · {doctor.isActive ? "Active" : "Inactive"}</p><div className="mt-2"><DoctorActiveToggle doctorId={doctor.id} isActive={doctor.isActive} /></div></div><span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted)]">{doctor.timezone}</span></div><details className="mt-4"><summary className="cursor-pointer text-sm text-[var(--primary)]">Edit provider profile</summary><div className="mt-4"><AdminDoctorForm specialties={specialties} doctor={doctor} /></div></details></article>)}</div> : <p className="mt-4 rounded-2xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--muted)]">No provider profiles match this search.</p>}</section>
  </main></>;
}
export default function AdminDoctorsPage({ searchParams }: { searchParams: SearchParams }) { return <Suspense fallback={<main className="min-h-screen animate-pulse bg-[var(--background)]" />}><DoctorsAdminContent searchParams={searchParams} /></Suspense>; }

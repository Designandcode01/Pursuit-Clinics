import Link from "next/link";
import { Suspense } from "react";
import { CancelPatientAppointment } from "@/components/appointments/cancel-patient-appointment";
import { PatientAppointmentCard } from "@/components/appointments/patient-appointment-card";
import { PatientNav } from "@/components/layout/patient-nav";
import { getPatientAppointments } from "@/features/appointments/queries";
import { requireRole } from "@/lib/auth/user";
import type { Appointment } from "@/db/schema";

type SearchParams = Promise<{ view?: string; status?: string }>;
const statuses: Appointment["status"][] = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "REJECTED"];

async function AppointmentsContent({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const view = params.view === "past" ? "past" : params.view === "all" ? "all" : "upcoming";
  const status = statuses.find((candidate) => candidate.toLowerCase() === params.status?.toLowerCase());
  const patient = await requireRole("PATIENT");
  const appointments = await getPatientAppointments(patient.id, status, view);
  return <><PatientNav /><main className="mx-auto min-h-screen w-full max-w-7xl px-6 py-8 lg:px-10"><p className="text-sm text-[var(--primary)]">Your visits</p><h1 className="mt-2 text-3xl font-medium tracking-tight">Appointments</h1>
    <nav className="mt-6 flex flex-wrap gap-2" aria-label="Appointment filters">{[["upcoming", "Upcoming"], ["past", "Past"], ["all", "All"]].map(([value, label]) => <Link key={value} href={`/patient/appointments?view=${value}`} className={`rounded-full border px-4 py-2 text-sm ${view === value ? "border-[var(--primary)] bg-[#15312b] text-[var(--primary)]" : "border-[var(--border)] text-[var(--muted)] hover:text-white"}`}>{label}</Link>)}{statuses.map((item) => <Link key={item} href={`/patient/appointments?view=${view}&status=${item.toLowerCase()}`} className={`rounded-full border px-3 py-2 text-xs ${status === item ? "border-[var(--primary)] text-[var(--primary)]" : "border-[var(--border)] text-[var(--muted)] hover:text-white"}`}>{item.charAt(0) + item.slice(1).toLowerCase()}</Link>)}</nav>
    {appointments.length ? <div className="mt-6 grid gap-3">{appointments.map((appointment) => <article key={appointment.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4"><PatientAppointmentCard appointment={appointment} />{appointment.canCancel && <div className="mt-3 flex justify-end"><CancelPatientAppointment appointmentId={appointment.id} /></div>}</article>)}</div> : <section className="mt-6 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-14 text-center"><h2 className="font-medium">No appointments in this view</h2><p className="mt-2 text-sm text-[var(--muted)]">Browse the doctor directory to find a time that suits you.</p><Link href="/doctors" className="mt-5 inline-flex rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-[#071411]">Find a doctor</Link></section>}
  </main></>;
}

export default function PatientAppointmentsPage({ searchParams }: { searchParams: SearchParams }) {
  return <Suspense fallback={<main className="min-h-screen animate-pulse bg-[var(--background)]" />}><AppointmentsContent searchParams={searchParams} /></Suspense>;
}

import Link from "next/link";
import { Suspense } from "react";
import type { Appointment } from "@/db/schema";
import { AppointmentTime } from "@/components/appointments/appointment-time";
import { DoctorAppointmentActions } from "@/components/appointments/doctor-appointment-actions";
import { StatusBadge } from "@/components/appointments/status-badge";
import { DoctorNav } from "@/components/layout/doctor-nav";
import { getDoctorAppointments } from "@/features/appointments/queries";
import { requireDoctorProfile } from "@/lib/auth/doctor";

type SearchParams = Promise<{ status?: string }>;
const statuses: Appointment["status"][] = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "REJECTED"];

async function DoctorAppointmentsContent({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const status = statuses.find((candidate) => candidate.toLowerCase() === params.status?.toLowerCase());
  const { profile } = await requireDoctorProfile();
  const appointments = await getDoctorAppointments(profile.id, status);
  return <><DoctorNav /><main className="mx-auto min-h-screen w-full max-w-7xl px-6 py-8 lg:px-10"><p className="text-sm text-[var(--primary)]">Doctor workspace</p><h1 className="mt-2 text-3xl font-medium tracking-tight">Appointments</h1><nav className="mt-6 flex flex-wrap gap-2" aria-label="Filter appointments"><Link href="/doctor/appointments" className={`rounded-full border px-3 py-2 text-xs ${!status ? "border-[var(--primary)] text-[var(--primary)]" : "border-[var(--border)] text-[var(--muted)]"}`}>All</Link>{statuses.map((item) => <Link key={item} href={`/doctor/appointments?status=${item.toLowerCase()}`} className={`rounded-full border px-3 py-2 text-xs ${status === item ? "border-[var(--primary)] text-[var(--primary)]" : "border-[var(--border)] text-[var(--muted)]"}`}>{item.charAt(0) + item.slice(1).toLowerCase()}</Link>)}</nav>
    {appointments.length ? <div className="mt-6 grid gap-4">{appointments.map((appointment) => <article key={appointment.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-medium">{appointment.patientName}</p><p className="mt-1 text-sm text-[var(--muted)]">{appointment.patientEmail}</p><p className="mt-3 text-sm"><AppointmentTime startAt={appointment.scheduledStartAt.toISOString()} endAt={appointment.scheduledEndAt.toISOString()} timezone={appointment.timezone} /></p></div><StatusBadge status={appointment.status} /></div>{appointment.reasonForVisit && <p className="mt-4 border-t border-[var(--border)] pt-3 text-sm text-[var(--muted)]"><span className="font-medium text-white">Reason:</span> {appointment.reasonForVisit}</p>}{appointment.patientNotes && <p className="mt-2 text-sm text-[var(--muted)]"><span className="font-medium text-white">Notes:</span> {appointment.patientNotes}</p>}<div className="mt-4"><DoctorAppointmentActions appointment={appointment} /></div></article>)}</div> : <section className="mt-6 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-14 text-center"><h2 className="font-medium">No appointments in this view</h2><p className="mt-2 text-sm text-[var(--muted)]">New booking requests will appear here.</p></section>}
  </main></>;
}

export default function DoctorAppointmentsPage({ searchParams }: { searchParams: SearchParams }) {
  return <Suspense fallback={<main className="min-h-screen animate-pulse bg-[var(--background)]" />}><DoctorAppointmentsContent searchParams={searchParams} /></Suspense>;
}

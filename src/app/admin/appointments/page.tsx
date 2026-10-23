import { Suspense } from "react";
import type { Appointment } from "@/db/schema";
import { AdminAppointmentStatusForm } from "@/components/admin/appointment-status-form";
import { StatusBadge } from "@/components/appointments/status-badge";
import { AppointmentTime } from "@/components/appointments/appointment-time";
import { AdminNav } from "@/components/layout/admin-nav";
import { getAdminAppointments } from "@/features/admin/queries";
import { requireRole } from "@/lib/auth/user";

type SearchParams = Promise<{ q?: string; status?: string }>;
const statuses: Appointment["status"][] = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "REJECTED"];
async function AppointmentsAdminContent({ searchParams }: { searchParams: SearchParams }) {
  await requireRole("ADMIN");
  const params = await searchParams;
  const status = statuses.find((candidate) => candidate.toLowerCase() === params.status?.toLowerCase());
  const query = params.q?.trim().slice(0, 100) ?? "";
  const appointments = await getAdminAppointments({ search: query, status });
  return <><AdminNav /><main className="mx-auto min-h-screen max-w-7xl px-6 py-8 lg:px-10"><p className="text-sm text-[var(--primary)]">Operations</p><h1 className="mt-2 text-3xl font-medium tracking-tight">Appointments</h1><form action="/admin/appointments" className="mt-6 grid gap-3 sm:grid-cols-[1fr_14rem_auto]"><input name="q" defaultValue={query} placeholder="Search patient, email, or doctor" className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)]" /><select name="status" defaultValue={status ?? ""} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm"><option value="">All statuses</option>{statuses.map((value) => <option key={value} value={value.toLowerCase()}>{value.charAt(0) + value.slice(1).toLowerCase()}</option>)}</select><button className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm">Search</button></form>
    {appointments.length ? <div className="mt-6 grid gap-3">{appointments.map((appointment) => <article key={appointment.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-medium">{appointment.patientName} <span className="font-normal text-[var(--muted)]">with</span> {appointment.doctorName}</p><p className="mt-1 text-sm text-[var(--muted)]">{appointment.patientEmail} · {appointment.specialty}</p><p className="mt-3 text-sm"><AppointmentTime startAt={appointment.startAt.toISOString()} endAt={appointment.endAt.toISOString()} timezone={appointment.timezone} /></p></div><StatusBadge status={appointment.status} /></div>{appointment.reason && <p className="mt-3 text-sm text-[var(--muted)]">Reason: {appointment.reason}</p>}<div className="mt-4 border-t border-[var(--border)] pt-4"><AdminAppointmentStatusForm appointmentId={appointment.id} currentStatus={appointment.status} /></div></article>)}</div> : <p className="mt-6 rounded-2xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--muted)]">No appointments match these filters.</p>}
  </main></>;
}
export default function AdminAppointmentsPage({ searchParams }: { searchParams: SearchParams }) { return <Suspense fallback={<main className="min-h-screen animate-pulse bg-[var(--background)]" />}><AppointmentsAdminContent searchParams={searchParams} /></Suspense>; }

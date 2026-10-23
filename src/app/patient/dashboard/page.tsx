import Link from "next/link";
import { Suspense } from "react";
import { AppointmentTime } from "@/components/appointments/appointment-time";
import { PatientAppointmentCard } from "@/components/appointments/patient-appointment-card";
import { PatientNav } from "@/components/layout/patient-nav";
import { getPatientDashboardSummary } from "@/features/appointments/queries";
import { requireRole } from "@/lib/auth/user";

async function DashboardContent() {
  const patient = await requireRole("PATIENT");
  const summary = await getPatientDashboardSummary(patient.id);
  return <><PatientNav /><main className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-10"><p className="text-sm text-[var(--primary)]">Your care</p><h1 className="mt-2 text-3xl font-medium tracking-tight">Welcome, {patient.name}</h1><p className="mt-2 text-[var(--muted)]">Keep your care plan and upcoming visits in one place.</p>
    <div className="mt-8 grid gap-4 lg:grid-cols-[1.4fr_.6fr]">
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6"><div className="flex items-center justify-between gap-3"><h2 className="font-medium">Next appointment</h2><Link href="/patient/appointments" className="text-xs text-[var(--primary)]">All appointments ↗</Link></div>
        {summary.nextAppointment ? <div className="mt-5 rounded-xl border border-[var(--border)] bg-[#0b1216] p-5"><p className="text-sm text-[var(--primary)]">{summary.nextAppointment.specialtyName}</p><h3 className="mt-1 text-lg font-medium">{summary.nextAppointment.doctorName}</h3><p className="mt-3 text-sm text-[var(--muted)]"><AppointmentTime startAt={summary.nextAppointment.scheduledStartAt.toISOString()} endAt={summary.nextAppointment.scheduledEndAt.toISOString()} /></p><Link href={`/patient/appointments/${summary.nextAppointment.id}`} className="mt-5 inline-flex text-sm text-[var(--primary)] hover:underline">Appointment details →</Link></div> : <div className="mt-5 rounded-xl border border-dashed border-[var(--border)] px-5 py-8"><p className="font-medium">Nothing on your calendar yet</p><p className="mt-2 text-sm text-[var(--muted)]">Find a doctor and choose an appointment time that works for you.</p><Link href="/doctors" className="mt-5 inline-flex rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-[#071411]">Find a doctor</Link></div>}
      </section>
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6"><p className="text-sm text-[var(--muted)]">Upcoming appointments</p><p className="mt-3 text-4xl font-medium">{summary.upcomingCount}</p><Link href="/patient/appointments?view=upcoming" className="mt-4 inline-flex text-sm text-[var(--primary)] hover:underline">View upcoming visits →</Link><div className="mt-7 border-t border-[var(--border)] pt-5"><Link href="/doctors" className="text-sm text-[var(--primary)] hover:underline">+ Find another doctor</Link></div></section>
    </div>
    <section className="mt-9"><div className="flex items-center justify-between"><h2 className="text-xl font-medium">Recent history</h2><Link href="/patient/appointments?view=past" className="text-sm text-[var(--muted)] hover:text-white">View history</Link></div>{summary.recentAppointments.length ? <div className="mt-4 grid gap-3">{summary.recentAppointments.map((appointment) => <PatientAppointmentCard key={appointment.id} appointment={appointment} />)}</div> : <p className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 text-sm text-[var(--muted)]">Your completed and past appointments will appear here.</p>}</section>
  </main></>;
}

export default function PatientDashboardPage() {
  return <Suspense fallback={<main className="min-h-screen animate-pulse bg-[var(--background)]" />}><DashboardContent /></Suspense>;
}

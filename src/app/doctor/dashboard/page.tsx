import Link from "next/link";
import { Suspense } from "react";
import { AppointmentTime } from "@/components/appointments/appointment-time";
import { StatusBadge } from "@/components/appointments/status-badge";
import { DoctorNav } from "@/components/layout/doctor-nav";
import { getDoctorDashboardSummary } from "@/features/appointments/queries";
import { requireDoctorProfile } from "@/lib/auth/doctor";

async function DoctorDashboardContent() {
  const { user, profile } = await requireDoctorProfile();
  const summary = await getDoctorDashboardSummary(profile.id);
  return <><DoctorNav /><main className="mx-auto min-h-screen w-full max-w-7xl px-6 py-8 lg:px-10"><p className="text-sm text-[var(--primary)]">Doctor workspace</p><h1 className="mt-2 text-3xl font-medium tracking-tight">Welcome, {profile.displayName || user.name}</h1><p className="mt-2 text-[var(--muted)]">Appointments and schedule in {profile.timezone}.</p>
    <div className="mt-8 grid gap-4 sm:grid-cols-3">{[["Today's visits", summary.today.length], ["Upcoming appointments", summary.upcomingCount], ["Needs your review", summary.pendingCount]].map(([label, value]) => <section key={label} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"><p className="text-sm text-[var(--muted)]">{label}</p><p className="mt-3 text-3xl font-medium">{value}</p></section>)}</div>
    <section className="mt-9"><div className="flex items-center justify-between"><h2 className="text-xl font-medium">Today&apos;s appointments</h2><Link href="/doctor/appointments" className="text-sm text-[var(--primary)]">All appointments ↗</Link></div>{summary.today.length ? <div className="mt-4 grid gap-3">{summary.today.map((appointment) => <article key={appointment.id} className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{appointment.patientName}</p><p className="mt-1 text-sm text-[var(--muted)]"><AppointmentTime startAt={appointment.scheduledStartAt.toISOString()} endAt={appointment.scheduledEndAt.toISOString()} timezone={appointment.timezone} /></p></div><StatusBadge status={appointment.status} /></article>)}</div> : <p className="mt-4 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-6 text-sm text-[var(--muted)]">No appointments scheduled for today.</p>}</section>
    <section className="mt-9"><h2 className="text-xl font-medium">Recent history</h2>{summary.recentAppointments.length ? <div className="mt-4 grid gap-3">{summary.recentAppointments.map((appointment) => <article key={appointment.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4"><div><p className="font-medium">{appointment.patientName}</p><p className="mt-1 text-xs text-[var(--muted)]"><AppointmentTime startAt={appointment.scheduledStartAt.toISOString()} timezone={appointment.timezone} /></p></div><StatusBadge status={appointment.status} /></article>)}</div> : <p className="mt-4 text-sm text-[var(--muted)]">Completed and past visits will appear here.</p>}</section>
    <section className="mt-8 flex flex-wrap gap-3"><Link href="/doctor/availability" className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm hover:border-[var(--primary)]">Manage availability</Link><Link href="/doctor/profile" className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm hover:border-[var(--primary)]">Edit professional profile</Link></section>
  </main></>;
}

export default function DoctorDashboardPage() {
  return <Suspense fallback={<main className="min-h-screen animate-pulse bg-[var(--background)]" />}><DoctorDashboardContent /></Suspense>;
}

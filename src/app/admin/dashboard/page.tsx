import Link from "next/link";
import { Suspense } from "react";
import { AppointmentTime } from "@/components/appointments/appointment-time";
import { StatusBadge } from "@/components/appointments/status-badge";
import { AdminNav } from "@/components/layout/admin-nav";
import { getAdminOverview } from "@/features/admin/queries";
import { requireRole } from "@/lib/auth/user";

async function AdminOverviewContent() {
  const admin = await requireRole("ADMIN");
  const summary = await getAdminOverview();
  const metrics = [["Patients", summary.patientCount, "/admin/patients"], ["Active doctors", summary.activeDoctorCount, "/admin/doctors"], ["Appointments", summary.appointmentCount, "/admin/appointments"], ["Pending bookings", summary.pendingCount, "/admin/appointments?status=pending"]] as const;
  return <><AdminNav /><main className="mx-auto min-h-screen w-full max-w-7xl px-6 py-8 lg:px-10"><p className="text-sm text-[var(--primary)]">Administration</p><h1 className="mt-2 text-3xl font-medium tracking-tight">Good day, {admin.name}</h1><p className="mt-2 text-sm text-[var(--muted)]">Operational overview for the appointment platform.</p><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{metrics.map(([label, value, href]) => <Link key={label} href={href} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 transition hover:border-[#3c7569]"><p className="text-sm text-[var(--muted)]">{label}</p><p className="mt-3 text-3xl font-medium">{value}</p><p className="mt-4 text-xs text-[var(--primary)]">Manage →</p></Link>)}</div><section className="mt-9"><div className="flex items-center justify-between"><h2 className="text-xl font-medium">Recent bookings</h2><Link href="/admin/appointments" className="text-sm text-[var(--primary)]">All appointments ↗</Link></div>{summary.recentBookings.length ? <div className="mt-4 grid gap-3">{summary.recentBookings.map((item) => <article key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4"><div><p className="text-sm font-medium">{item.patientName} <span className="font-normal text-[var(--muted)]">with</span> {item.doctorName}</p><p className="mt-1 text-xs text-[var(--muted)]"><AppointmentTime startAt={item.startAt.toISOString()} timezone={item.timezone} /></p></div><StatusBadge status={item.status} /></article>)}</div> : <p className="mt-4 rounded-2xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--muted)]">New bookings will appear here.</p>}</section></main></>;
}

export default function AdminDashboardPage() {
  return <Suspense fallback={<main className="min-h-screen animate-pulse bg-[var(--background)]" />}><AdminOverviewContent /></Suspense>;
}

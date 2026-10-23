import { asc, eq } from "drizzle-orm";
import { Suspense } from "react";
import { AppointmentTime } from "@/components/appointments/appointment-time";
import { DeleteAvailabilityButton, DeleteTimeOffButton, TimeOffForm, WeeklyAvailabilityForm } from "@/components/doctor/availability-forms";
import { DoctorNav } from "@/components/layout/doctor-nav";
import { db } from "@/db";
import { doctorAvailability, doctorTimeOff } from "@/db/schema";
import { requireDoctorProfile } from "@/lib/auth/doctor";

const dayNames = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

async function AvailabilityContent() {
  const { profile } = await requireDoctorProfile();
  const [weekly, timeOff] = await Promise.all([
    db.select().from(doctorAvailability).where(eq(doctorAvailability.doctorId, profile.id)).orderBy(asc(doctorAvailability.dayOfWeek), asc(doctorAvailability.startTime)),
    db.select().from(doctorTimeOff).where(eq(doctorTimeOff.doctorId, profile.id)).orderBy(asc(doctorTimeOff.startAt)).limit(100),
  ]);
  return <><DoctorNav /><main className="mx-auto min-h-screen max-w-5xl px-6 py-8 lg:px-10"><p className="text-sm text-[var(--primary)]">Schedule settings</p><h1 className="mt-2 text-3xl font-medium tracking-tight">Availability</h1><p className="mt-2 text-sm text-[var(--muted)]">Weekly hours and blocked time use your configured local timezone: <span className="text-white">{profile.timezone}</span>.</p>
    <section className="mt-8"><h2 className="text-xl font-medium">Weekly hours</h2><p className="mt-2 mb-4 text-sm text-[var(--muted)]">Appointment slots are generated using your visit length and buffer settings.</p><div className="grid gap-3">{weekly.map((item) => <div key={item.id} className="grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4"><WeeklyAvailabilityForm item={item} /><div className="flex items-center justify-between"><span className={`text-xs ${item.isAvailable ? "text-[var(--success)]" : "text-[var(--muted)]"}`}>{dayNames[item.dayOfWeek]} · {item.isAvailable ? "Open" : "Paused"}</span><DeleteAvailabilityButton id={item.id} /></div></div>)}{!weekly.length && <p className="rounded-2xl border border-dashed border-[var(--border)] p-5 text-sm text-[var(--muted)]">No weekly hours configured.</p>}</div><h3 className="mt-6 mb-3 font-medium">Add a weekly window</h3><WeeklyAvailabilityForm /></section>
    <section className="mt-10"><h2 className="text-xl font-medium">Time off and blocked times</h2><p className="mt-2 mb-4 text-sm text-[var(--muted)]">These date and time ranges are interpreted in {profile.timezone}.</p><TimeOffForm /><div className="mt-4 grid gap-3">{timeOff.map((item) => <article key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4"><div><p className="text-sm"><AppointmentTime startAt={item.startAt.toISOString()} endAt={item.endAt.toISOString()} timezone={profile.timezone} /></p>{item.reason && <p className="mt-1 text-xs text-[var(--muted)]">{item.reason}</p>}</div><DeleteTimeOffButton id={item.id} /></article>)}{!timeOff.length && <p className="rounded-2xl border border-dashed border-[var(--border)] p-5 text-sm text-[var(--muted)]">No blocked times added.</p>}</div></section>
  </main></>;
}

export default function DoctorAvailabilityPage() {
  return <Suspense fallback={<main className="min-h-screen animate-pulse bg-[var(--background)]" />}><AvailabilityContent /></Suspense>;
}

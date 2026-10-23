import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DemoDoctorAppointment } from "@/components/appointments/demo-doctor-appointment";
import { DEMO_DOCTORS, demoDataEnabled } from "@/features/doctors/demo-data";
import { localDateTimeToInstant, parseDate } from "@/features/availability/timezone";

type SearchParams = Promise<{ date?: string; time?: string; timezone?: string; doctor?: string; status?: string }>;
const sampleSlots = new Map([["10:00 AM", "10:00"], ["1:30 PM", "13:30"], ["3:00 PM", "15:00"]]);

async function DemoDoctorContent({ searchParams }: { searchParams: SearchParams }) {
  if (!demoDataEnabled()) notFound();
  const params = await searchParams;
  const doctor = DEMO_DOCTORS.find((item) => item.displayName === params.doctor);
  const wallTime = params.time ? sampleSlots.get(params.time) : undefined;
  const date = params.date && parseDate(params.date) ? params.date : undefined;
  const start = doctor && date && wallTime && params.timezone === doctor.timezone
    ? localDateTimeToInstant(`${date}T${wallTime}`, doctor.timezone)
    : null;
  const end = start && doctor ? new Date(start.getTime() + doctor.appointmentDurationMinutes * 60_000) : null;
  const sampleStatus = params.status === "CONFIRMED" || params.status === "REJECTED" || params.status === "CANCELLED" ? params.status : "PENDING";
  const patientHref = doctor && date && params.time && params.timezone
    ? `/demo/patient?date=${encodeURIComponent(date)}&time=${encodeURIComponent(params.time)}&timezone=${encodeURIComponent(params.timezone)}&doctor=${encodeURIComponent(doctor.displayName)}`
    : "/demo/patient";

  return <main className="mx-auto min-h-screen max-w-5xl px-6 py-10 lg:px-10">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm text-[var(--primary)]">Local preview</p><h1 className="mt-2 text-3xl font-medium tracking-tight">Doctor workspace</h1><p className="mt-2 text-sm text-[var(--muted)]">Sample request review · no provider account or appointment records are stored.</p></div><Link href={`${patientHref}&status=${sampleStatus}`} className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm hover:border-[var(--primary)]">Back to patient preview</Link></div>
    <section className="mt-7 rounded-xl border border-[#8b7547]/40 bg-[#211d14] px-4 py-3 text-sm leading-6 text-[#dfc98f]"><strong>Fictional preview data.</strong> This workspace is available only in local demo mode. The controls below change this screen’s sample state only.</section>
    {doctor && start && end ? <><div className="mt-8"><p className="text-sm text-[var(--muted)]">Signed in as (sample)</p><h2 className="mt-1 text-xl font-medium">{doctor.displayName}</h2><p className="mt-1 text-sm text-[var(--muted)]">{doctor.specialtyName}</p></div><section className="mt-8"><h2 className="text-xl font-medium">Appointment requests <span className="ml-1 text-sm font-normal text-[var(--muted)]">1 sample</span></h2><DemoDoctorAppointment key={`${doctor.id}-${start.toISOString()}-${sampleStatus}`} doctorName={doctor.displayName} specialtyName={doctor.specialtyName} startAt={start.toISOString()} endAt={end.toISOString()} timezone={doctor.timezone} initialStatus={sampleStatus} patientHref={patientHref} /></section></> : <p className="mt-8 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-6 text-sm text-[var(--muted)]">No valid sample request selected. Choose a fictional appointment from the booking preview first.</p>}
  </main>;
}

export default function DemoDoctorPage({ searchParams }: { searchParams: SearchParams }) {
  return <Suspense fallback={<main className="min-h-screen animate-pulse bg-[var(--background)]" />}><DemoDoctorContent searchParams={searchParams} /></Suspense>;
}

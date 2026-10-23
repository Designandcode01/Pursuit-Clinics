import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DemoPatientAppointment } from "@/components/appointments/demo-patient-appointment";
import { DEMO_DOCTORS, demoDataEnabled } from "@/features/doctors/demo-data";
import { localDateTimeToInstant, parseDate } from "@/features/availability/timezone";

type SearchParams = Promise<{ date?: string; time?: string; timezone?: string; doctor?: string; status?: string }>;
const sampleTimes = new Set(["10:00 AM", "1:30 PM", "3:00 PM"]);

async function DemoPatientContent({ searchParams }: { searchParams: SearchParams }) {
  if (!demoDataEnabled()) notFound();
  const params = await searchParams;
  const demoDoctor = DEMO_DOCTORS.find((doctor) => doctor.displayName === params.doctor);
  const dateIsValid = Boolean(params.date && parseDate(params.date));
  let hasSampleAppointment = false;
  let sampleStart: string | null = null;
  let sampleEnd: string | null = null;
  if (demoDoctor && dateIsValid && params.date && params.time && sampleTimes.has(params.time) && params.timezone === demoDoctor.timezone) {
    const [hours, minutes] = params.time === "1:30 PM" ? [13, 30] : params.time === "3:00 PM" ? [15, 0] : [10, 0];
    const local = localDateTimeToInstant(`${params.date}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`, demoDoctor.timezone);
    if (local) {
      hasSampleAppointment = true;
      sampleStart = local.toISOString();
      sampleEnd = new Date(local.getTime() + demoDoctor.appointmentDurationMinutes * 60_000).toISOString();
    }
  }
  const doctorPreviewHref = hasSampleAppointment && demoDoctor && params.date && params.time && params.timezone
    ? `/demo/doctor?date=${encodeURIComponent(params.date)}&time=${encodeURIComponent(params.time)}&timezone=${encodeURIComponent(params.timezone)}&doctor=${encodeURIComponent(demoDoctor.displayName)}`
    : null;
  const sampleStatus = params.status === "CONFIRMED" || params.status === "REJECTED" || params.status === "CANCELLED" ? params.status : "PENDING";

  return <main className="mx-auto min-h-screen max-w-5xl px-6 py-10 lg:px-10"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm text-[var(--primary)]">Local preview</p><h1 className="mt-2 text-3xl font-medium tracking-tight">Patient dashboard</h1><p className="mt-2 text-sm text-[var(--muted)]">Sample view · no patient account or appointments are stored.</p></div><Link href="/doctors" className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm hover:border-[var(--primary)]">Back to directory</Link></div>
    <section className="mt-7 rounded-xl border border-[#8b7547]/40 bg-[#211d14] px-4 py-3 text-sm text-[#dfc98f]"><strong>Fictional preview data.</strong> This page is only available in local demo mode. It is not connected to an account or appointment record.</section>
    {hasSampleAppointment && demoDoctor && sampleStart && sampleEnd && doctorPreviewHref ? <DemoPatientAppointment key={`${demoDoctor.id}-${sampleStart}-${sampleStatus}`} doctorName={demoDoctor.displayName} specialtyName={demoDoctor.specialtyName} startAt={sampleStart} endAt={sampleEnd} timezone={demoDoctor.timezone} initialStatus={sampleStatus} doctorHref={doctorPreviewHref} /> : <><div className="mt-7 grid gap-4 sm:grid-cols-3"><article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"><p className="text-sm text-[var(--muted)]">Upcoming appointments</p><p className="mt-3 text-3xl font-medium">0</p></article><article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"><p className="text-sm text-[var(--muted)]">Account</p><p className="mt-3 text-lg font-medium">Preview only</p></article><article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"><p className="text-sm text-[var(--muted)]">Saved appointments</p><p className="mt-3 text-lg font-medium">None</p></article></div><section className="mt-9"><h2 className="text-xl font-medium">Upcoming appointments</h2><p className="mt-4 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-6 text-sm text-[var(--muted)]">No sample appointment selected. Return to the doctor directory to preview a booking flow.</p></section></>}
  </main>;
}

export default function DemoPatientPage({ searchParams }: { searchParams: SearchParams }) {
  return <Suspense fallback={<main className="min-h-screen animate-pulse bg-[var(--background)]" />}><DemoPatientContent searchParams={searchParams} /></Suspense>;
}

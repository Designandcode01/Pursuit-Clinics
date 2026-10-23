"use client";

import Link from "next/link";
import { useState } from "react";
import { AppointmentTime } from "@/components/appointments/appointment-time";
import { StatusBadge } from "@/components/appointments/status-badge";
import type { Appointment } from "@/db/schema";

type DemoPatientStatus = Extract<Appointment["status"], "PENDING" | "CONFIRMED" | "CANCELLED" | "REJECTED">;

export function DemoPatientAppointment({ doctorName, specialtyName, startAt, endAt, timezone, initialStatus, doctorHref }: {
  doctorName: string;
  specialtyName: string;
  startAt: string;
  endAt: string;
  timezone: string;
  initialStatus: DemoPatientStatus;
  doctorHref: string;
}) {
  const [status, setStatus] = useState<DemoPatientStatus>(initialStatus);
  const isUpcoming = status === "PENDING" || status === "CONFIRMED";
  const sectionTitle = status === "CANCELLED" ? "Cancelled appointment" : status === "REJECTED" ? "Declined appointment" : "Upcoming appointments";

  return <>
    <div className="mt-7 grid gap-4 sm:grid-cols-3"><article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"><p className="text-sm text-[var(--muted)]">Upcoming appointments</p><p className="mt-3 text-3xl font-medium">{isUpcoming ? "1" : "0"}</p></article><article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"><p className="text-sm text-[var(--muted)]">Account</p><p className="mt-3 text-lg font-medium">Preview only</p></article><article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"><p className="text-sm text-[var(--muted)]">Saved appointments</p><p className="mt-3 text-lg font-medium">None</p></article></div>
    <section className="mt-9"><h2 className="text-xl font-medium">{sectionTitle}</h2><article className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs text-[var(--primary)]">{specialtyName} · sample appointment</p><h3 className="mt-1 text-lg font-medium">{doctorName}</h3><p className="mt-2 text-sm text-[var(--muted)]"><AppointmentTime startAt={startAt} endAt={endAt} timezone={timezone} /></p></div><StatusBadge status={status} /></div>
    <p className="mt-4 border-t border-[var(--border)] pt-3 text-xs text-[var(--muted)]">Fictional status for preview. No appointment was booked.</p>
    <div className="mt-4 flex flex-wrap gap-3">
      {(status === "PENDING" || status === "CONFIRMED") && <button type="button" onClick={() => setStatus("CANCELLED")} className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm hover:border-[#f08a8e] hover:text-[#f08a8e]">Preview cancel</button>}
      {status === "CANCELLED" && <button type="button" onClick={() => setStatus("PENDING")} className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm hover:border-[var(--primary)]">Reset sample state</button>}
      <Link href={`${doctorHref}&status=${status}`} className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm hover:border-[var(--primary)]">Preview doctor workspace</Link>
    </div>
    </article></section>
  </>;
}

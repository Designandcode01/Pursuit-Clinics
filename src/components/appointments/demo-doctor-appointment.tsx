"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AppointmentTime } from "@/components/appointments/appointment-time";
import { StatusBadge } from "@/components/appointments/status-badge";
import type { Appointment } from "@/db/schema";

type DemoStatus = Extract<Appointment["status"], "PENDING" | "CONFIRMED" | "REJECTED" | "CANCELLED">;

export function DemoDoctorAppointment({ doctorName, specialtyName, startAt, endAt, timezone, initialStatus, patientHref }: {
  doctorName: string;
  specialtyName: string;
  startAt: string;
  endAt: string;
  timezone: string;
  initialStatus: DemoStatus;
  patientHref: string;
}) {
  const [status, setStatus] = useState<DemoStatus>(initialStatus);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const changeStatus = (nextStatus: DemoStatus) => {
    setStatus(nextStatus);
    const query = new URLSearchParams(searchParams.toString());
    query.set("status", nextStatus);
    router.replace(`${pathname}?${query.toString()}`, { scroll: false });
  };

  return <article className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-xs text-[var(--primary)]">{specialtyName} · sample request</p><h2 className="mt-1 text-lg font-medium">{doctorName}</h2><p className="mt-2 text-sm text-[var(--muted)]"><AppointmentTime startAt={startAt} endAt={endAt} timezone={timezone} /></p></div>
      <StatusBadge status={status} />
    </div>
    <div className="mt-5 rounded-xl border border-[#8b7547]/40 bg-[#211d14] px-4 py-3 text-sm leading-6 text-[#dfc98f]" role="status"><strong>Simulation only.</strong> This does not update an appointment or notify a patient.</div>
    {status === "PENDING" ? <div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={() => changeStatus("CONFIRMED")} className="rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-[#071411] hover:bg-[var(--primary-strong)]">Preview confirm</button><button type="button" onClick={() => changeStatus("REJECTED")} className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm hover:border-[#f08a8e] hover:text-[#f08a8e]">Preview reject</button></div> : <div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={() => changeStatus("PENDING")} className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm hover:border-[var(--primary)]">Reset sample state</button><Link href={`${patientHref}&status=${status}`} className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm hover:border-[var(--primary)]">View patient preview</Link></div>}
  </article>;
}

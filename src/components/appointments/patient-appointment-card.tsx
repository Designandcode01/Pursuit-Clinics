import Link from "next/link";
import { AppointmentTime } from "@/components/appointments/appointment-time";
import { StatusBadge } from "@/components/appointments/status-badge";

type PatientAppointment = {
  id: string; scheduledStartAt: Date; scheduledEndAt: Date; status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "REJECTED";
  doctorId: string; doctorName: string; specialtyName: string; timezone: string; canCancel?: boolean;
};

export function PatientAppointmentCard({ appointment }: { appointment: PatientAppointment }) {
  return <article className="flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-3"><h2 className="font-medium">{appointment.doctorName}</h2><StatusBadge status={appointment.status} /></div><p className="mt-1 text-sm text-[var(--muted)]">{appointment.specialtyName}</p><p className="mt-3 text-sm text-white"><AppointmentTime startAt={appointment.scheduledStartAt.toISOString()} endAt={appointment.scheduledEndAt.toISOString()} timezone={appointment.timezone} /></p></div><Link href={`/patient/appointments/${appointment.id}`} className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-center text-sm transition hover:border-[var(--primary)] hover:text-[var(--primary)]">View details</Link></article>;
}

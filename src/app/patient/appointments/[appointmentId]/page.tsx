import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AppointmentTime } from "@/components/appointments/appointment-time";
import { CancelPatientAppointment } from "@/components/appointments/cancel-patient-appointment";
import { StatusBadge } from "@/components/appointments/status-badge";
import { PatientNav } from "@/components/layout/patient-nav";
import { getPatientAppointment } from "@/features/appointments/queries";
import { formatConsultationFee } from "@/lib/format";
import { requireRole } from "@/lib/auth/user";

async function AppointmentDetails({ params }: { params: Promise<{ appointmentId: string }> }) {
  const { appointmentId } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(appointmentId)) notFound();
  const patient = await requireRole("PATIENT");
  const appointment = await getPatientAppointment(patient.id, appointmentId);
  if (!appointment) notFound();
  const canCancel = appointment.canCancel;

  return <><PatientNav /><main className="mx-auto min-h-screen max-w-4xl px-6 py-8 lg:px-10"><Link href="/patient/appointments" className="text-sm text-[var(--muted)] hover:text-white">← Appointments</Link><section className="mt-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-9"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm text-[var(--primary)]">{appointment.specialtyName}</p><h1 className="mt-2 text-3xl font-medium tracking-tight">{appointment.doctorName}</h1></div><StatusBadge status={appointment.status} /></div><div className="mt-8 grid gap-4 sm:grid-cols-2"><div className="rounded-xl border border-[var(--border)] bg-[#0b1216] p-4"><p className="text-xs text-[var(--muted)]">Appointment time</p><p className="mt-2 text-sm"><AppointmentTime startAt={appointment.scheduledStartAt.toISOString()} endAt={appointment.scheduledEndAt.toISOString()} timezone={appointment.timezone} /></p></div><div className="rounded-xl border border-[var(--border)] bg-[#0b1216] p-4"><p className="text-xs text-[var(--muted)]">Consultation fee</p><p className="mt-2 text-sm">{formatConsultationFee(appointment.consultationFee)}</p></div></div>{appointment.reasonForVisit && <div className="mt-6"><h2 className="text-sm font-medium">Reason for visit</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{appointment.reasonForVisit}</p></div>}{appointment.patientNotes && <div className="mt-5"><h2 className="text-sm font-medium">Notes</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{appointment.patientNotes}</p></div>}{appointment.cancellationReason && <div className="mt-5"><h2 className="text-sm font-medium">Cancellation note</h2><p className="mt-2 text-sm text-[var(--muted)]">{appointment.cancellationReason}</p></div>}{canCancel && <div className="mt-8 border-t border-[var(--border)] pt-5"><p className="mb-3 text-xs text-[var(--muted)]">Appointments can be cancelled at least 24 hours before the start time.</p><CancelPatientAppointment appointmentId={appointment.id} /></div>}</section></main></>;
}

export default async function PatientAppointmentDetailsPage({ params }: { params: Promise<{ appointmentId: string }> }) {
  return <Suspense fallback={<main className="min-h-screen animate-pulse bg-[var(--background)]" />}><AppointmentDetails params={params} /></Suspense>;
}

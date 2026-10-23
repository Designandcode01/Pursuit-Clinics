"use client";

import { useActionState } from "react";
import { updateDoctorAppointment, type DoctorActionState } from "@/actions/doctor";
import type { Appointment } from "@/db/schema";

const initialState: DoctorActionState = {};

function StatusAction({ appointmentId, action, label, confirm }: { appointmentId: string; action: string; label: string; confirm?: boolean }) {
  const [state, formAction, pending] = useActionState(updateDoctorAppointment, initialState);
  return <form action={formAction} onSubmit={(event) => { if (confirm && !window.confirm(`${label} this appointment?`)) event.preventDefault(); }} className="inline-flex flex-col items-start gap-2">
    <input type="hidden" name="appointmentId" value={appointmentId} /><input type="hidden" name="action" value={action} />
    {action === "cancel" || action === "reject" ? <input name="reason" maxLength={500} placeholder="Optional note" aria-label="Optional note" className="w-40 rounded-lg border border-[var(--border)] bg-[#0b1216] px-2.5 py-2 text-xs outline-none focus:border-[var(--primary)]" /> : null}
    <button disabled={pending} className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs transition hover:border-[var(--primary)] disabled:opacity-50">{pending ? "Saving…" : label}</button>
    {state.error && <span role="alert" className="text-xs text-[var(--danger)]">{state.error}</span>}{state.success && <span role="status" className="text-xs text-[var(--success)]">{state.success}</span>}
  </form>;
}

export function DoctorAppointmentActions({ appointment }: { appointment: { id: string; status: Appointment["status"]; canConfirm: boolean; canReject: boolean; canComplete: boolean; canCancel: boolean } }) {
  return <div className="flex flex-wrap gap-2">{appointment.canConfirm && <StatusAction appointmentId={appointment.id} action="confirm" label="Confirm" />}{appointment.canReject && <StatusAction appointmentId={appointment.id} action="reject" label="Reject" confirm />}{appointment.canComplete && <StatusAction appointmentId={appointment.id} action="complete" label="Mark completed" />}{appointment.canCancel && <StatusAction appointmentId={appointment.id} action="cancel" label="Cancel" confirm />}</div>;
}

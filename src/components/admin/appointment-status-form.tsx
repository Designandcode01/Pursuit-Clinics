"use client";

import { useActionState } from "react";
import { setAdminAppointmentStatus } from "@/actions/admin";
import type { DoctorActionState } from "@/actions/doctor";

export function AdminAppointmentStatusForm({ appointmentId, currentStatus }: { appointmentId: string; currentStatus: string }) {
  const [state, action, pending] = useActionState(setAdminAppointmentStatus, {} satisfies DoctorActionState);
  const options = currentStatus === "PENDING" ? [["CONFIRMED", "Confirm"], ["REJECTED", "Reject"], ["CANCELLED", "Cancel"]] : currentStatus === "CONFIRMED" ? [["COMPLETED", "Complete"], ["CANCELLED", "Cancel"]] : [];
  if (!options.length) return <span className="text-xs text-[var(--muted)]">Final status</span>;
  return <form action={action} onSubmit={(event) => { const selected = new FormData(event.currentTarget).get("status"); if (["CANCELLED", "REJECTED"].includes(String(selected)) && !window.confirm(`Set appointment to ${String(selected).toLowerCase()}?`)) event.preventDefault(); }} className="flex flex-wrap items-center gap-2">
    <input type="hidden" name="appointmentId" value={appointmentId} /><select name="status" required defaultValue="" className="rounded-lg border border-[var(--border)] bg-[#0b1216] px-2.5 py-2 text-xs text-white"><option value="" disabled>Update status</option>{options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
    <button disabled={pending} className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs hover:border-[var(--primary)] disabled:opacity-50">{pending ? "Saving…" : "Apply"}</button>
    {state.error && <span role="alert" className="w-full text-xs text-[var(--danger)]">{state.error}</span>}{state.success && <span role="status" className="w-full text-xs text-[var(--success)]">{state.success}</span>}
  </form>;
}

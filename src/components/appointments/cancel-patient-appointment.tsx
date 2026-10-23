"use client";

import { useActionState } from "react";
import { cancelPatientAppointment, type BookingActionState } from "@/actions/appointments";

const initialState: BookingActionState = {};

export function CancelPatientAppointment({ appointmentId }: { appointmentId: string }) {
  const [state, action, pending] = useActionState(cancelPatientAppointment, initialState);
  return (
    <form action={action} onSubmit={(event) => { if (!window.confirm("Cancel this appointment?")) event.preventDefault(); }}>
      <input type="hidden" name="appointmentId" value={appointmentId} />
      <button type="submit" disabled={pending} className="rounded-xl border border-[#623a3e] px-4 py-2 text-sm text-[var(--danger)] transition hover:bg-[#301a1d] disabled:opacity-50">{pending ? "Cancelling…" : "Cancel appointment"}</button>
      {state.error && <p className="mt-2 text-sm text-[var(--danger)]" role="alert">{state.error}</p>}
    </form>
  );
}

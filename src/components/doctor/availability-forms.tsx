"use client";

import { useActionState } from "react";
import { addDoctorTimeOff, deleteDoctorAvailability, deleteDoctorTimeOff, saveDoctorAvailability, type DoctorActionState } from "@/actions/doctor";

const initialState: DoctorActionState = {};
const days = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function WeeklyAvailabilityForm({ item }: { item?: { id: string; dayOfWeek: number; startTime: string; endTime: string; isAvailable: boolean } }) {
  const [state, action, pending] = useActionState(saveDoctorAvailability, initialState);
  return <form action={action} className="grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:grid-cols-[1.3fr_1fr_1fr_1fr_auto] sm:items-end">
    {item && <input type="hidden" name="availabilityId" value={item.id} />}
    <label className="text-xs text-[var(--muted)]">Day<select name="dayOfWeek" defaultValue={item?.dayOfWeek ?? "1"} className="mt-2 block w-full rounded-lg border border-[var(--border)] bg-[#0b1216] px-2.5 py-2.5 text-sm text-white">{days.slice(1).map((day, index) => <option key={day} value={index + 1}>{day}</option>)}</select></label>
    <label className="text-xs text-[var(--muted)]">Start<input name="startTime" type="time" required defaultValue={item?.startTime.slice(0, 5) ?? "09:00"} className="mt-2 block w-full rounded-lg border border-[var(--border)] bg-[#0b1216] px-2.5 py-2.5 text-sm text-white" /></label>
    <label className="text-xs text-[var(--muted)]">End<input name="endTime" type="time" required defaultValue={item?.endTime.slice(0, 5) ?? "17:00"} className="mt-2 block w-full rounded-lg border border-[var(--border)] bg-[#0b1216] px-2.5 py-2.5 text-sm text-white" /></label>
    <label className="text-xs text-[var(--muted)]">Availability<select name="isAvailable" defaultValue={String(item?.isAvailable ?? true)} className="mt-2 block w-full rounded-lg border border-[var(--border)] bg-[#0b1216] px-2.5 py-2.5 text-sm text-white"><option value="true">Available</option><option value="false">Unavailable</option></select></label>
    <button disabled={pending} className="rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-[#071411] disabled:opacity-50">{pending ? "Saving…" : item ? "Update" : "Add"}</button>
    {(state.error || state.success) && <p className={`text-xs sm:col-span-5 ${state.error ? "text-[var(--danger)]" : "text-[var(--success)]"}`} role={state.error ? "alert" : "status"}>{state.error ?? state.success}</p>}
  </form>;
}

export function DeleteAvailabilityButton({ id }: { id: string }) {
  const [state, action, pending] = useActionState(deleteDoctorAvailability, initialState);
  return <form action={action} onSubmit={(event) => { if (!window.confirm("Remove this weekly availability window?")) event.preventDefault(); }}><input type="hidden" name="availabilityId" value={id} /><button disabled={pending} className="text-xs text-[var(--danger)] hover:underline">{pending ? "Removing…" : "Remove"}</button>{state.error && <span role="alert" className="ml-2 text-xs text-[var(--danger)]">{state.error}</span>}</form>;
}

export function TimeOffForm() {
  const [state, action, pending] = useActionState(addDoctorTimeOff, initialState);
  return <form action={action} className="grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:grid-cols-2">
    <label className="text-xs text-[var(--muted)]">Starts (doctor local time)<input type="datetime-local" required name="startLocal" className="mt-2 block w-full rounded-lg border border-[var(--border)] bg-[#0b1216] px-3 py-2.5 text-sm text-white" /></label>
    <label className="text-xs text-[var(--muted)]">Ends<input type="datetime-local" required name="endLocal" className="mt-2 block w-full rounded-lg border border-[var(--border)] bg-[#0b1216] px-3 py-2.5 text-sm text-white" /></label>
    <label className="text-xs text-[var(--muted)] sm:col-span-2">Reason (optional)<input name="reason" maxLength={500} className="mt-2 block w-full rounded-lg border border-[var(--border)] bg-[#0b1216] px-3 py-2.5 text-sm text-white" /></label>
    {state.error && <p className="text-sm text-[var(--danger)] sm:col-span-2" role="alert">{state.error}</p>}{state.success && <p className="text-sm text-[var(--success)] sm:col-span-2" role="status">{state.success}</p>}
    <button disabled={pending} className="w-fit rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-[#071411] disabled:opacity-50">{pending ? "Saving…" : "Block time"}</button>
  </form>;
}

export function DeleteTimeOffButton({ id }: { id: string }) {
  const [state, action, pending] = useActionState(deleteDoctorTimeOff, initialState);
  return <form action={action} onSubmit={(event) => { if (!window.confirm("Remove this blocked time?")) event.preventDefault(); }}><input type="hidden" name="timeOffId" value={id} /><button disabled={pending} className="text-xs text-[var(--danger)] hover:underline">{pending ? "Removing…" : "Remove"}</button>{state.error && <span role="alert" className="ml-2 text-xs text-[var(--danger)]">{state.error}</span>}</form>;
}

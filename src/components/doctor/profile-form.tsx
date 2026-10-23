"use client";

import { useActionState } from "react";
import { updateDoctorProfile, type DoctorActionState } from "@/actions/doctor";

const initialState: DoctorActionState = {};

export function DoctorProfileForm({ profile }: { profile: { displayName: string; biography: string | null; qualifications: string | null; appointmentDurationMinutes: number; bufferMinutes: number } }) {
  const [state, action, pending] = useActionState(updateDoctorProfile, initialState);
  return <form action={action} className="grid gap-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
    <label className="text-sm">Display name<input name="displayName" required minLength={2} maxLength={200} defaultValue={profile.displayName} className="mt-2 block w-full rounded-xl border border-[var(--border)] bg-[#0b1216] px-3 py-3 outline-none focus:border-[var(--primary)]" /></label>
    <label className="text-sm">Qualifications<textarea name="qualifications" maxLength={1000} rows={2} defaultValue={profile.qualifications ?? ""} className="mt-2 block w-full rounded-xl border border-[var(--border)] bg-[#0b1216] px-3 py-3 outline-none focus:border-[var(--primary)]" /></label>
    <label className="text-sm">Biography<textarea name="biography" maxLength={5000} rows={5} defaultValue={profile.biography ?? ""} className="mt-2 block w-full rounded-xl border border-[var(--border)] bg-[#0b1216] px-3 py-3 outline-none focus:border-[var(--primary)]" /></label>
    <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm">Appointment length (minutes)<input name="appointmentDurationMinutes" type="number" min={15} max={120} step={5} defaultValue={profile.appointmentDurationMinutes} className="mt-2 block w-full rounded-xl border border-[var(--border)] bg-[#0b1216] px-3 py-3 outline-none focus:border-[var(--primary)]" /></label><label className="text-sm">Buffer time (minutes)<input name="bufferMinutes" type="number" min={0} max={60} step={5} defaultValue={profile.bufferMinutes} className="mt-2 block w-full rounded-xl border border-[var(--border)] bg-[#0b1216] px-3 py-3 outline-none focus:border-[var(--primary)]" /></label></div>
    {state.error && <p className="text-sm text-[var(--danger)]" role="alert">{state.error}</p>}{state.success && <p className="text-sm text-[var(--success)]" role="status">{state.success}</p>}
    <button disabled={pending} className="w-fit rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-[#071411] disabled:opacity-50">{pending ? "Saving…" : "Save profile"}</button>
  </form>;
}

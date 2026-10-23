"use client";

import { useActionState } from "react";
import Link from "next/link";
import { saveAdminDoctor, setDoctorActiveStatus } from "@/actions/admin";
import type { DoctorActionState } from "@/actions/doctor";

const initialState: DoctorActionState = {};
type SpecialtyOption = { id: string; name: string };
type DoctorFormValue = { clerkUserId?: string; displayName?: string; specialtyId?: string; biography?: string | null; qualifications?: string | null; websiteUrl?: string | null; fee?: number; consultationFee?: number; duration?: number; buffer?: number; timezone?: string; isActive?: boolean };

export function AdminDoctorForm({ specialties, doctor }: { specialties: SpecialtyOption[]; doctor?: DoctorFormValue }) {
  const [state, action, pending] = useActionState(saveAdminDoctor, initialState);
  return <form action={action} className="grid gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:grid-cols-2">
    <label className="text-xs text-[var(--muted)] sm:col-span-2">Clerk user ID<input name="clerkUserId" required defaultValue={doctor?.clerkUserId} placeholder="user_… (account must already exist)" className="mt-2 block w-full rounded-lg border border-[var(--border)] bg-[#0b1216] px-3 py-2.5 text-sm text-white" /></label>
    <label className="text-xs text-[var(--muted)]">Public display name<input name="displayName" required minLength={2} maxLength={200} defaultValue={doctor?.displayName} className="mt-2 block w-full rounded-lg border border-[var(--border)] bg-[#0b1216] px-3 py-2.5 text-sm text-white" /></label>
    <label className="text-xs text-[var(--muted)]">Specialty<select name="specialtyId" required defaultValue={doctor?.specialtyId ?? ""} className="mt-2 block w-full rounded-lg border border-[var(--border)] bg-[#0b1216] px-3 py-2.5 text-sm text-white"><option value="" disabled>{specialties.length ? "Select one" : "Add a specialty first"}</option>{specialties.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><Link href="/admin/specialties" className="mt-2 inline-flex text-xs text-[var(--primary)] hover:underline">Add or manage specialties →</Link></label>
    <label className="text-xs text-[var(--muted)] sm:col-span-2">Qualifications<textarea name="qualifications" maxLength={1000} rows={2} defaultValue={doctor?.qualifications ?? ""} className="mt-2 block w-full rounded-lg border border-[var(--border)] bg-[#0b1216] px-3 py-2.5 text-sm text-white" /></label>
    <label className="text-xs text-[var(--muted)] sm:col-span-2">Doctor website URL <input name="websiteUrl" type="url" maxLength={2048} defaultValue={doctor?.websiteUrl ?? ""} placeholder="https://example.com" className="mt-2 block w-full rounded-lg border border-[var(--border)] bg-[#0b1216] px-3 py-2.5 text-sm text-white" /></label>
    <label className="text-xs text-[var(--muted)] sm:col-span-2">Biography<textarea name="biography" maxLength={5000} rows={3} defaultValue={doctor?.biography ?? ""} className="mt-2 block w-full rounded-lg border border-[var(--border)] bg-[#0b1216] px-3 py-2.5 text-sm text-white" /></label>
    <label className="text-xs text-[var(--muted)]">Consultation fee (PKR)<input name="consultationFee" type="number" min={0} step={0.01} required defaultValue={(doctor?.fee ?? doctor?.consultationFee ?? 0) / 100} className="mt-2 block w-full rounded-lg border border-[var(--border)] bg-[#0b1216] px-3 py-2.5 text-sm text-white" /></label>
    <label className="text-xs text-[var(--muted)]">Timezone<input name="timezone" required defaultValue={doctor?.timezone ?? "Asia/Karachi"} placeholder="Asia/Karachi" className="mt-2 block w-full rounded-lg border border-[var(--border)] bg-[#0b1216] px-3 py-2.5 text-sm text-white" /></label>
    <label className="text-xs text-[var(--muted)]">Visit length (minutes)<input name="appointmentDurationMinutes" type="number" min={15} max={120} step={5} required defaultValue={doctor?.duration ?? 30} className="mt-2 block w-full rounded-lg border border-[var(--border)] bg-[#0b1216] px-3 py-2.5 text-sm text-white" /></label>
    <label className="text-xs text-[var(--muted)]">Buffer (minutes)<input name="bufferMinutes" type="number" min={0} max={60} step={5} required defaultValue={doctor?.buffer ?? 10} className="mt-2 block w-full rounded-lg border border-[var(--border)] bg-[#0b1216] px-3 py-2.5 text-sm text-white" /></label>
    <label className="text-xs text-[var(--muted)]">Directory status<select name="isActive" defaultValue={String(doctor?.isActive ?? false)} className="mt-2 block w-full rounded-lg border border-[var(--border)] bg-[#0b1216] px-3 py-2.5 text-sm text-white"><option value="true">Active</option><option value="false">Inactive</option></select></label>
    {state.error && <p role="alert" className="text-sm text-[var(--danger)] sm:col-span-2">{state.error}</p>}{state.success && <p role="status" className="text-sm text-[var(--success)] sm:col-span-2">{state.success}</p>}
    <button disabled={pending} className="w-fit rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-[#071411] disabled:opacity-50">{pending ? "Saving…" : doctor ? "Save provider" : "Create provider"}</button>
  </form>;
}

export function DoctorActiveToggle({ doctorId, isActive }: { doctorId: string; isActive: boolean }) {
  const [state, action, pending] = useActionState(setDoctorActiveStatus, initialState);
  return <form action={action}><input type="hidden" name="doctorId" value={doctorId} /><input type="hidden" name="isActive" value={String(!isActive)} /><button disabled={pending} className="text-xs text-[var(--primary)] hover:underline">{pending ? "Saving…" : isActive ? "Deactivate" : "Activate"}</button>{state.error && <span role="alert" className="ml-2 text-xs text-[var(--danger)]">{state.error}</span>}{state.success && <span role="status" className="ml-2 text-xs text-[var(--success)]">{state.success}</span>}</form>;
}

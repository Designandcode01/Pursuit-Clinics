"use client";

import { useActionState } from "react";
import { createSpecialty, updateSpecialty } from "@/actions/admin";
import type { DoctorActionState } from "@/actions/doctor";

export function SpecialtyForm({ item }: { item?: { id: string; name: string; slug: string; description: string | null } }) {
  const actionCreator = item ? updateSpecialty : createSpecialty;
  const [state, action, pending] = useActionState(actionCreator, {} satisfies DoctorActionState);
  return <form action={action} className="grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:grid-cols-[1fr_1fr_2fr_auto] sm:items-end">{item && <input type="hidden" name="specialtyId" value={item.id} />}<label className="text-xs text-[var(--muted)]">Name<input name="name" required minLength={2} maxLength={120} defaultValue={item?.name} className="mt-2 block w-full rounded-lg border border-[var(--border)] bg-[#0b1216] px-3 py-2.5 text-sm text-white" /></label><label className="text-xs text-[var(--muted)]">URL slug<input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="primary-care" defaultValue={item?.slug} className="mt-2 block w-full rounded-lg border border-[var(--border)] bg-[#0b1216] px-3 py-2.5 text-sm text-white" /></label><label className="text-xs text-[var(--muted)]">Description<input name="description" maxLength={1000} defaultValue={item?.description ?? ""} className="mt-2 block w-full rounded-lg border border-[var(--border)] bg-[#0b1216] px-3 py-2.5 text-sm text-white" /></label><button disabled={pending} className="rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-[#071411] disabled:opacity-50">{pending ? "Saving…" : item ? "Save" : "Add specialty"}</button>{state.error && <p role="alert" className="text-sm text-[var(--danger)] sm:col-span-4">{state.error}</p>}{state.success && <p role="status" className="text-sm text-[var(--success)] sm:col-span-4">{state.success}</p>}</form>;
}

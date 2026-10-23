"use client";

import { useActionState, useEffect, useState } from "react";
import { addCalendarDay } from "@/features/availability/timezone";
import { bookAppointment, type BookingActionState } from "@/actions/appointments";
import type { AvailableSlot } from "@/features/availability/service";

const initialState: BookingActionState = {};

function previousCalendarDay(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const previous = new Date(Date.UTC(year!, month! - 1, day! - 1));
  return `${previous.getUTCFullYear()}-${String(previous.getUTCMonth() + 1).padStart(2, "0")}-${String(previous.getUTCDate()).padStart(2, "0")}`;
}

function shiftCalendarDate(date: string, days: number): string {
  let shifted = date;
  const direction = days < 0 ? -1 : 1;
  for (let index = 0; index < Math.abs(days); index += 1) {
    shifted = direction < 0 ? previousCalendarDay(shifted) : addCalendarDay(shifted);
  }
  return shifted;
}

export function BookingForm({ doctorId, timezone, minDate }: { doctorId: string; timezone: string; minDate: string }) {
  const [date, setDate] = useState(minDate);
  const maxDate = Array.from({ length: 90 }).reduce<string>((lastDate) => addCalendarDay(lastDate), minDate);
  const [availability, setAvailability] = useState<{ date: string; slots: AvailableSlot[] } | null>(null);
  const [failedDate, setFailedDate] = useState<string | null>(null);
  const [selection, setSelection] = useState<{ date: string; startAt: string } | null>(null);
  const slots = availability?.date === date ? availability.slots : [];
  const selected = selection?.date === date ? selection.startAt : "";
  const loading = availability?.date !== date && failedDate !== date;
  const [state, action, pending] = useActionState(bookAppointment, initialState);

  function navigateDate(days: number) {
    const nextDate = shiftCalendarDate(date, days);
    if (nextDate < minDate || nextDate > maxDate) return;
    setDate(nextDate);
    setSelection(null);
  }

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/doctors/${doctorId}/availability?date=${encodeURIComponent(date)}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Availability unavailable");
        return response.json() as Promise<{ slots: AvailableSlot[] }>;
      })
      .then((data) => setAvailability({ date, slots: data.slots }))
      .catch((error: unknown) => {
        if (error instanceof Error && error.name !== "AbortError") setFailedDate(date);
      })
    return () => controller.abort();
  }, [date, doctorId]);

  return (
    <form action={action} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-7">
      <input type="hidden" name="doctorId" value={doctorId} />
      <input type="hidden" name="scheduledStartAt" value={selected} />
      <div className="block text-sm font-medium"><label htmlFor="booking-date">Choose a date <span className="font-normal text-[var(--muted)]">({timezone})</span></label>
        <div className="mt-2 flex flex-wrap items-center gap-2"><button type="button" aria-label="Previous day" disabled={date <= minDate} onClick={() => navigateDate(-1)} className="rounded-xl border border-[var(--border)] px-4 py-3 text-sm text-white hover:border-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-40">←</button><input id="booking-date" type="date" min={minDate} max={maxDate} value={date} aria-describedby="booking-date-help" onKeyDown={(event) => { const days = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key]; if (days !== undefined) { event.preventDefault(); navigateDate(days); } }} onChange={(event) => { if (event.target.value >= minDate && event.target.value <= maxDate) { setDate(event.target.value); setSelection(null); } }} className="block w-full rounded-xl border border-[var(--border)] bg-[#0b1216] px-3 py-3 text-sm text-white outline-none focus:border-[var(--primary)] sm:max-w-xs" /><button type="button" aria-label="Next day" disabled={date >= maxDate} onClick={() => navigateDate(1)} className="rounded-xl border border-[var(--border)] px-4 py-3 text-sm text-white hover:border-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-40">→</button></div><p id="booking-date-help" className="mt-2 text-xs font-normal text-[var(--muted)]">Use ← / → for one day or ↑ / ↓ for one week. Dates are limited to the next 90 days.</p>
      </div>
      <fieldset className="mt-6"><legend className="text-sm font-medium">Available times</legend>
        {loading ? <p className="mt-3 text-sm text-[var(--muted)]" role="status">Checking availability…</p> : failedDate === date ? <p className="mt-3 rounded-xl border border-dashed border-[var(--border)] px-4 py-5 text-sm text-[var(--danger)]">Availability could not be loaded. Please try another date.</p> : slots.length ? <div role="radiogroup" aria-label="Available times" className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">{slots.map((slot) => <label key={slot.startAt} className={`cursor-pointer rounded-xl border px-3 py-3 text-center text-sm transition focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--primary)] ${selected === slot.startAt ? "border-[var(--primary)] bg-[#15312b] text-[var(--primary)]" : "border-[var(--border)] bg-[#0b1216] hover:border-[#3c7569]"}`}><input className="sr-only" type="radio" name="timeSlot" value={slot.startAt} checked={selected === slot.startAt} onChange={() => setSelection({ date, startAt: slot.startAt })} /><span>{slot.label}</span></label>)}</div> : <p className="mt-3 rounded-xl border border-dashed border-[var(--border)] px-4 py-5 text-sm text-[var(--muted)]">No times are available for this date. Try another day.</p>}
      </fieldset>
      <label className="mt-6 block text-sm font-medium">Reason for visit <span className="font-normal text-[var(--muted)]">(optional)</span><textarea name="reasonForVisit" maxLength={500} rows={3} className="mt-2 block w-full rounded-xl border border-[var(--border)] bg-[#0b1216] px-3 py-3 text-sm text-white outline-none placeholder:text-[#75858a] focus:border-[var(--primary)]" placeholder="A short note to help the doctor prepare" /></label>
      {state.error && <p className="mt-4 text-sm text-[var(--danger)]" role="alert">{state.error}</p>}
      <button type="submit" disabled={pending || loading || !selected} className="mt-6 w-full rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-[#071411] transition hover:bg-[var(--primary-strong)] disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto">{pending ? "Booking…" : "Confirm appointment"}</button>
      <p className="mt-3 text-xs text-[var(--muted)]">New appointments are pending until the doctor confirms them.</p>
    </form>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";

const sampleTimes = ["10:00 AM", "1:30 PM", "3:00 PM"];

function nextLocalDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const next = new Date(Date.UTC(year!, month! - 1, day! + 1));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-${String(next.getUTCDate()).padStart(2, "0")}`;
}

function dayLabel(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" })
    .format(new Date(Date.UTC(year!, month! - 1, day!, 12)));
}

export function DemoBookingPreview({ doctorName, timezone, firstDate }: { doctorName: string; timezone: string; firstDate: string }) {
  const dates = [firstDate, nextLocalDate(firstDate), nextLocalDate(nextLocalDate(firstDate))];
  const [selectedDate, setSelectedDate] = useState(firstDate);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  if (confirmed && selectedTime) {
    const dashboardHref = `/demo/patient?date=${encodeURIComponent(selectedDate)}&time=${encodeURIComponent(selectedTime)}&timezone=${encodeURIComponent(timezone)}&doctor=${encodeURIComponent(doctorName)}`;
    return <section role="status" className="mt-8 rounded-3xl border border-[var(--success)]/30 bg-[var(--surface)] p-7 sm:p-9"><p className="text-sm font-medium text-[var(--success)]">Demo preview complete</p><h2 className="mt-2 text-2xl font-medium">That’s what booking could look like</h2><p className="mt-3 text-sm leading-6 text-[var(--muted)]">Sample appointment with {doctorName} on {dayLabel(selectedDate)} at {selectedTime} ({timezone}). No appointment was created, saved, or sent to a clinic.</p><div className="mt-6 flex flex-wrap gap-3"><Link href={dashboardHref} className="rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-[#071411] hover:bg-[var(--primary-strong)]">View demo patient dashboard</Link><button type="button" onClick={() => { setConfirmed(false); setSelectedTime(null); }} className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm hover:border-[var(--primary)]">Try another sample time</button></div></section>;
  }

  return <section className="mt-8 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-9"><div className="rounded-xl border border-[#8b7547]/40 bg-[#211d14] px-4 py-3 text-sm text-[#dfc98f]"><strong>Demo only.</strong> These sample times are fictional. Continuing will not create a real appointment or transmit your information.</div><h2 className="mt-7 text-xl font-medium">Choose a sample date</h2><div className="mt-4 grid grid-cols-3 gap-2 sm:max-w-lg">{dates.map((date) => <button key={date} type="button" aria-pressed={selectedDate === date} onClick={() => { setSelectedDate(date); setSelectedTime(null); }} className={`rounded-xl border px-3 py-3 text-sm ${selectedDate === date ? "border-[var(--primary)] bg-[#15312b] text-[var(--primary)]" : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--primary)]"}`}>{dayLabel(date)}</button>)}</div><h2 className="mt-7 text-xl font-medium">Sample times <span className="text-sm font-normal text-[var(--muted)]">({timezone})</span></h2><div className="mt-4 flex flex-wrap gap-2">{sampleTimes.map((time) => <button key={time} type="button" aria-pressed={selectedTime === time} onClick={() => setSelectedTime(time)} className={`rounded-xl border px-4 py-2.5 text-sm ${selectedTime === time ? "border-[var(--primary)] bg-[#15312b] text-[var(--primary)]" : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--primary)]"}`}>{time}</button>)}</div><button type="button" disabled={!selectedTime} onClick={() => setConfirmed(true)} className="mt-7 rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-[#071411] transition hover:bg-[var(--primary-strong)] disabled:cursor-not-allowed disabled:opacity-40">Preview confirmation</button></section>;
}

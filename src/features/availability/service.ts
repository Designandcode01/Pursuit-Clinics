import "server-only";
import { and, eq, gt, inArray, lt } from "drizzle-orm";
import { db } from "@/db";
import { appointments, doctorAvailability, doctorProfiles, doctorTimeOff } from "@/db/schema";
import { addCalendarDay, localDateAt, localDayInterval, localTimeToInstant, parseDate, partsAt } from "@/features/availability/timezone";

const MINUTE_MS = 60_000;
const MAX_BOOKING_DAYS = 90;

export type AvailableSlot = { startAt: string; endAt: string; label: string; timezone: string };

function clockMinutes(clock: string): number {
  const [hours, minutes] = clock.split(":").map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

function isoWeekday(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  const weekday = new Date(Date.UTC(year!, month! - 1, day!)).getUTCDay();
  return weekday === 0 ? 7 : weekday;
}

function formatSlotLabel(instant: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en", { timeZone: timezone, hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(instant);
}

export async function getAvailableSlots(doctorId: string, localDate: string, now = new Date()): Promise<AvailableSlot[]> {
  const parsedDate = parseDate(localDate);
  if (!parsedDate) return [];
  const [doctor] = await db.select({
    id: doctorProfiles.id,
    duration: doctorProfiles.appointmentDurationMinutes,
    buffer: doctorProfiles.bufferMinutes,
    timezone: doctorProfiles.timezone,
  }).from(doctorProfiles).where(and(eq(doctorProfiles.id, doctorId), eq(doctorProfiles.isActive, true))).limit(1);
  if (!doctor) return [];

  // Fail closed for invalid timezone configuration.
  try { new Intl.DateTimeFormat("en", { timeZone: doctor.timezone }); } catch { return []; }

  const currentLocalDate = localDateAt(now, doctor.timezone);
  const maxLocalDate = Array.from({ length: MAX_BOOKING_DAYS }, (_, index) => index)
    .reduce<string>((date) => addCalendarDay(date), currentLocalDate);
  if (localDate < currentLocalDate || localDate > maxLocalDate) return [];

  const weekday = isoWeekday(localDate);
  const schedules = await db.select().from(doctorAvailability).where(and(
    eq(doctorAvailability.doctorId, doctor.id), eq(doctorAvailability.dayOfWeek, weekday), eq(doctorAvailability.isAvailable, true),
  ));
  if (!schedules.length) return [];

  const dayInterval = localDayInterval(localDate, doctor.timezone);
  if (!dayInterval) return [];

  const [timeOff, busyAppointments] = await Promise.all([
    db.select({ startAt: doctorTimeOff.startAt, endAt: doctorTimeOff.endAt })
      .from(doctorTimeOff).where(and(eq(doctorTimeOff.doctorId, doctor.id), lt(doctorTimeOff.startAt, dayInterval.end), gt(doctorTimeOff.endAt, dayInterval.start))),
    db.select({ startAt: appointments.scheduledStartAt, endAt: appointments.scheduledEndAt })
      .from(appointments).where(and(eq(appointments.doctorId, doctor.id), inArray(appointments.status, ["PENDING", "CONFIRMED"]), lt(appointments.scheduledStartAt, dayInterval.end), gt(appointments.scheduledEndAt, dayInterval.start))),
  ]);

  const slots = new Map<string, AvailableSlot>();
  for (const schedule of schedules) {
    const startMinute = clockMinutes(schedule.startTime);
    const endMinute = clockMinutes(schedule.endTime);
    const step = doctor.duration + doctor.buffer;
    for (let localMinute = startMinute; localMinute + doctor.duration <= endMinute; localMinute += step) {
      const startAt = localTimeToInstant(localDate, localMinute, doctor.timezone);
      if (!startAt || startAt <= now) continue;
      const endAt = new Date(startAt.getTime() + doctor.duration * MINUTE_MS);
      const endLocal = partsAt(endAt, doctor.timezone);
      const endLocalDate = `${endLocal.year}-${String(endLocal.month).padStart(2, "0")}-${String(endLocal.day).padStart(2, "0")}`;
      const localBoundary = localMinute + doctor.duration;
      const endBoundaryHour = Math.floor(localBoundary / 60);
      const endBoundaryMinute = localBoundary % 60;
      if (endLocalDate !== localDate || endLocal.hour * 60 + endLocal.minute > endBoundaryHour * 60 + endBoundaryMinute) continue;

      const overlapsTimeOff = timeOff.some((block) => startAt < block.endAt && endAt > block.startAt);
      const padding = doctor.buffer * MINUTE_MS;
      const overlapsAppointment = busyAppointments.some((booked) => startAt.getTime() < booked.endAt.getTime() + padding && endAt.getTime() > booked.startAt.getTime() - padding);
      if (overlapsTimeOff || overlapsAppointment) continue;
      const startIso = startAt.toISOString();
      slots.set(startIso, { startAt: startIso, endAt: endAt.toISOString(), label: formatSlotLabel(startAt, doctor.timezone), timezone: doctor.timezone });
    }
  }

  return [...slots.values()].sort((left, right) => left.startAt.localeCompare(right.startAt));
}

export type LocalParts = { year: number; month: number; day: number; hour: number; minute: number; second: number };
export type CalendarDate = { year: number; month: number; day: number };

export function partsAt(instant: Date, timezone: string): LocalParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(instant);
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  return { year: value("year"), month: value("month"), day: value("day"), hour: value("hour"), minute: value("minute"), second: value("second") };
}

export function localDateAt(instant: Date, timezone: string): string {
  const { year, month, day } = partsAt(instant, timezone);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function parseDate(date: string): CalendarDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return null;
  const [year, month, day] = match.slice(1).map(Number);
  const parsed = new Date(Date.UTC(year!, month! - 1, day!));
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month! - 1 || parsed.getUTCDate() !== day) return null;
  return { year: year!, month: month!, day: day! };
}

export function addCalendarDay(date: string): string {
  const calendar = parseDate(date);
  if (!calendar) return date;
  const next = new Date(Date.UTC(calendar.year, calendar.month - 1, calendar.day + 1));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-${String(next.getUTCDate()).padStart(2, "0")}`;
}

/** Maps a doctor-local wall time to the earliest matching instant. Missing DST times return null. */
export function localTimeToInstant(date: string, minuteOfDay: number, timezone: string): Date | null {
  const calendar = parseDate(date);
  if (!calendar || minuteOfDay < 0 || minuteOfDay >= 1440) return null;
  const hour = Math.floor(minuteOfDay / 60);
  const minute = minuteOfDay % 60;
  const targetWallMs = Date.UTC(calendar.year, calendar.month - 1, calendar.day, hour, minute);
  const offsets = new Set<number>();
  for (let deltaHours = -36; deltaHours <= 36; deltaHours += 6) {
    const sample = new Date(targetWallMs + deltaHours * 3_600_000);
    const sampleParts = partsAt(sample, timezone);
    const representedAsUtc = Date.UTC(sampleParts.year, sampleParts.month - 1, sampleParts.day, sampleParts.hour, sampleParts.minute, sampleParts.second);
    offsets.add(representedAsUtc - sample.getTime());
  }
  const candidates = [...offsets].map((offset) => new Date(targetWallMs - offset)).filter((candidate) => {
    const local = partsAt(candidate, timezone);
    return local.year === calendar.year && local.month === calendar.month && local.day === calendar.day && local.hour === hour && local.minute === minute && local.second === 0;
  }).sort((left, right) => left.getTime() - right.getTime());
  return candidates[0] ?? null;
}

export function localDateTimeToInstant(value: string, timezone: string): Date | null {
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const minuteOfDay = Number(match[2]) * 60 + Number(match[3]);
  return localTimeToInstant(match[1]!, minuteOfDay, timezone);
}

export function localDayInterval(date: string, timezone: string): { start: Date; end: Date } | null {
  const start = localTimeToInstant(date, 0, timezone);
  const end = localTimeToInstant(addCalendarDay(date), 0, timezone);
  return start && end ? { start, end } : null;
}

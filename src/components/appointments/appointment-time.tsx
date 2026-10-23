export function AppointmentTime({ startAt, endAt, timezone = "UTC" }: { startAt: string | Date; endAt?: string | Date; timezone?: string }) {
  const start = new Date(startAt);
  const formatter = new Intl.DateTimeFormat("en-PK", { timeZone: timezone, year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" });
  const startLabel = formatter.format(start);
  const endLabel = endAt ? new Intl.DateTimeFormat("en-PK", { timeZone: timezone, hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(new Date(endAt)) : "";
  return <time dateTime={start.toISOString()}>{endLabel ? `${startLabel} – ${endLabel}` : startLabel}</time>;
}

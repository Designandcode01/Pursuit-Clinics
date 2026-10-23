import { describe, expect, it } from "vitest";
import { localDateAt, localDateTimeToInstant, localDayInterval, parseDate } from "../src/features/availability/timezone";

describe("doctor-local scheduling time", () => {
  it("rejects invalid calendar dates and malformed local input", () => {
    expect(parseDate("2026-02-30")).toBeNull();
    expect(localDateTimeToInstant("2026-02-30T10:00", "America/New_York")).toBeNull();
    expect(localDateTimeToInstant("10:00", "America/New_York")).toBeNull();
  });

  it("skips local wall times that do not exist during spring DST changes", () => {
    expect(localDateTimeToInstant("2026-03-08T02:30", "America/New_York")).toBeNull();
    expect(localDateTimeToInstant("2026-03-08T03:30", "America/New_York")?.toISOString()).toBe("2026-03-08T07:30:00.000Z");
  });

  it("chooses the earlier instant for an ambiguous fall-back wall time", () => {
    expect(localDateTimeToInstant("2026-11-01T01:30", "America/New_York")?.toISOString()).toBe("2026-11-01T05:30:00.000Z");
  });

  it("builds doctor-local days with the correct DST length", () => {
    const springDay = localDayInterval("2026-03-08", "America/New_York");
    const fallDay = localDayInterval("2026-11-01", "America/New_York");
    expect(springDay).not.toBeNull();
    expect(fallDay).not.toBeNull();
    expect(springDay!.end.getTime() - springDay!.start.getTime()).toBe(23 * 60 * 60 * 1000);
    expect(fallDay!.end.getTime() - fallDay!.start.getTime()).toBe(25 * 60 * 60 * 1000);
    expect(localDateAt(new Date("2026-01-01T02:00:00.000Z"), "America/Los_Angeles")).toBe("2025-12-31");
  });
});

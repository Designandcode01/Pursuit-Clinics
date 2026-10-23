import { describe, expect, it } from "vitest";
import { canAdminSetAppointmentStatus, canDoctorApplyAction, canPatientCancel } from "../src/features/appointments/policy";

const now = new Date("2026-10-22T12:00:00.000Z");
const futureStart = new Date("2026-10-24T12:00:00.000Z");
const futureEnd = new Date("2026-10-24T12:30:00.000Z");
const pastStart = new Date("2026-10-20T12:00:00.000Z");
const pastEnd = new Date("2026-10-20T12:30:00.000Z");

describe("appointment status policies", () => {
  it("allows patient cancellation only for active appointments at least 24 hours away", () => {
    expect(canPatientCancel("PENDING", futureStart, now)).toBe(true);
    expect(canPatientCancel("CONFIRMED", new Date(now.getTime() + 24 * 60 * 60 * 1000), now)).toBe(true);
    expect(canPatientCancel("CONFIRMED", new Date(now.getTime() + 24 * 60 * 60 * 1000 - 1), now)).toBe(false);
    expect(canPatientCancel("COMPLETED", futureStart, now)).toBe(false);
  });

  it("enforces doctor action timing and valid source statuses", () => {
    expect(canDoctorApplyAction("PENDING", "confirm", futureStart, futureEnd, now)).toBe(true);
    expect(canDoctorApplyAction("PENDING", "confirm", pastStart, pastEnd, now)).toBe(false);
    expect(canDoctorApplyAction("CONFIRMED", "reject", futureStart, futureEnd, now)).toBe(false);
    expect(canDoctorApplyAction("CONFIRMED", "complete", pastStart, pastEnd, now)).toBe(true);
    expect(canDoctorApplyAction("CONFIRMED", "complete", futureStart, futureEnd, now)).toBe(false);
  });

  it("limits administrator transitions to valid appointment lifecycle changes", () => {
    expect(canAdminSetAppointmentStatus("PENDING", "CONFIRMED", futureStart, futureEnd, now)).toBe(true);
    expect(canAdminSetAppointmentStatus("COMPLETED", "CONFIRMED", pastStart, pastEnd, now)).toBe(false);
    expect(canAdminSetAppointmentStatus("PENDING", "COMPLETED", futureStart, futureEnd, now)).toBe(false);
    expect(canAdminSetAppointmentStatus("CONFIRMED", "COMPLETED", pastStart, pastEnd, now)).toBe(true);
  });
});

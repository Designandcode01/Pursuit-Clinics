import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/db";
import { getAvailableSlots } from "@/features/availability/service";
import { requireRole } from "@/lib/auth/user";
import { bookAppointment } from "@/actions/appointments";

vi.mock("server-only", () => ({}));
vi.mock("@/db", () => ({ db: { select: vi.fn(), insert: vi.fn() } }));
vi.mock("@/features/availability/service", () => ({ getAvailableSlots: vi.fn() }));
vi.mock("@/lib/auth/user", () => ({ requireRole: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`NEXT_REDIRECT:${path}`); } }));

const mockDb = db as unknown as { select: ReturnType<typeof vi.fn>; insert: ReturnType<typeof vi.fn> };
const mockRequireRole = vi.mocked(requireRole);
const mockGetAvailableSlots = vi.mocked(getAvailableSlots);
const doctorId = "20000000-0000-4000-8000-000000000001";
const appointmentId = "30000000-0000-4000-8000-000000000001";
const startAt = "2030-04-11T09:00:00.000Z";
const endAt = "2030-04-11T09:30:00.000Z";
const patient = {
  id: "40000000-0000-4000-8000-000000000001", clerkUserId: "user_test_patient",
  name: "Test Patient", email: "patient@example.test", role: "PATIENT" as const,
  imageUrl: null, createdAt: new Date("2026-01-01T00:00:00.000Z"), updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

function bookingForm(date = startAt): FormData {
  const form = new FormData();
  form.set("doctorId", doctorId);
  form.set("scheduledStartAt", date);
  form.set("reasonForVisit", "Routine visit");
  return form;
}

function arrangeDoctorLookup(found = true) {
  mockDb.select.mockReturnValue({ from: () => ({ where: () => ({ limit: async () => found ? [{ id: doctorId, timezone: "Asia/Karachi" }] : [] }) }) });
}

function arrangeInsert(result: unknown[] | Error) {
  const values = vi.fn().mockReturnValue({
    returning: async () => {
      if (result instanceof Error) throw result;
      return result;
    },
  });
  mockDb.insert.mockReturnValue({ values });
  return values;
}

describe("bookAppointment Server Action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireRole.mockResolvedValue(patient);
    mockGetAvailableSlots.mockResolvedValue([{ startAt, endAt, label: "2:00 PM PKT", timezone: "Asia/Karachi" }]);
    arrangeDoctorLookup();
  });

  it("rejects unauthenticated requests before querying or inserting", async () => {
    mockRequireRole.mockRejectedValue(new Error("redirect:/sign-in"));
    await expect(bookAppointment({}, bookingForm())).rejects.toThrow("redirect:/sign-in");
    expect(mockRequireRole).toHaveBeenCalledWith("PATIENT");
    expect(mockDb.select).not.toHaveBeenCalled();
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("rejects authenticated users without the patient role", async () => {
    mockRequireRole.mockRejectedValue(new Error("not-found"));
    await expect(bookAppointment({}, bookingForm())).rejects.toThrow("not-found");
    expect(mockRequireRole).toHaveBeenCalledWith("PATIENT");
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("rejects an unknown or inactive doctor", async () => {
    arrangeDoctorLookup(false);
    await expect(bookAppointment({}, bookingForm())).resolves.toEqual({ error: "This doctor is not available for booking." });
    expect(mockGetAvailableSlots).not.toHaveBeenCalled();
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("rejects a past or otherwise unavailable appointment time", async () => {
    mockGetAvailableSlots.mockResolvedValue([]);
    await expect(bookAppointment({}, bookingForm("2020-01-01T09:00:00.000Z"))).resolves.toEqual({
      error: "That time was just taken or is no longer bookable. Choose another slot.",
    });
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("persists an authorized available booking as PENDING", async () => {
    const values = arrangeInsert([{ id: appointmentId }]);
    await expect(bookAppointment({}, bookingForm())).rejects.toThrow(`NEXT_REDIRECT:/patient/appointments/${appointmentId}`);
    expect(values).toHaveBeenCalledWith(expect.objectContaining({
      patientId: patient.id, doctorId, scheduledStartAt: new Date(startAt), scheduledEndAt: new Date(endAt),
      status: "PENDING", reasonForVisit: "Routine visit",
    }));
  });

  it("returns a recoverable conflict when PostgreSQL rejects a concurrent overlap", async () => {
    arrangeInsert(Object.assign(new Error("overlap"), { cause: { code: "23P01" } }));
    await expect(bookAppointment({}, bookingForm())).resolves.toEqual({ error: "That time was just taken. Choose another available slot." });
  });
});

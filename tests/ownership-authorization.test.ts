import { beforeEach, describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";
import { db } from "@/db";
import { getPatientAppointment } from "@/features/appointments/queries";
import { updateDoctorAppointment } from "@/actions/doctor";
import { setAdminAppointmentStatus } from "@/actions/admin";
import { requireRole } from "@/lib/auth/user";
import { requireDoctorProfile } from "@/lib/auth/doctor";

vi.mock("server-only", () => ({}));
vi.mock("@/db", () => ({ db: { select: vi.fn(), update: vi.fn() } }));
vi.mock("@/lib/auth/user", () => ({ requireRole: vi.fn() }));
vi.mock("@/lib/auth/doctor", () => ({ requireDoctorProfile: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const mockDb = db as unknown as { select: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
const mockRequireRole = vi.mocked(requireRole);
const mockRequireDoctorProfile = vi.mocked(requireDoctorProfile);
const patientId = "40000000-0000-4000-8000-000000000001";
const doctorId = "20000000-0000-4000-8000-000000000001";
const appointmentId = "30000000-0000-4000-8000-000000000001";

function whereSql(expression: SQL): string {
  return new PgDialect().sqlToQuery(expression).sql;
}

function actionForm(fields: Record<string, string>): FormData {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.set(key, value);
  return form;
}

describe("server-side ownership and role checks", () => {
  beforeEach(() => vi.clearAllMocks());

  it("scopes patient appointment details by both appointment and authenticated patient IDs", async () => {
    const limit = vi.fn().mockResolvedValue([]);
    let patientWhere: SQL | undefined;
    const where = vi.fn((expression: SQL) => { patientWhere = expression; return { limit }; });
    const secondJoin = { innerJoin: vi.fn(() => ({ where })) };
    const from = vi.fn(() => ({ innerJoin: vi.fn(() => secondJoin) }));
    mockDb.select.mockReturnValue({ from });

    await expect(getPatientAppointment(patientId, appointmentId)).resolves.toBeNull();
    expect(where).toHaveBeenCalledTimes(1);
    if (!patientWhere) throw new Error("Expected a patient ownership condition.");
    const sql = whereSql(patientWhere);
    expect(sql).toContain('"appointments"."patient_id"');
    expect(sql).toContain('"appointments"."id"');
  });

  it("scopes doctor appointment mutations to the authenticated doctor's profile", async () => {
    mockRequireDoctorProfile.mockResolvedValue({
      user: { id: patientId, role: "DOCTOR" },
      profile: { id: doctorId },
    } as Awaited<ReturnType<typeof requireDoctorProfile>>);
    const limit = vi.fn().mockResolvedValue([]);
    let doctorWhere: SQL | undefined;
    const where = vi.fn((expression: SQL) => { doctorWhere = expression; return { limit }; });
    mockDb.select.mockReturnValue({ from: () => ({ where }) });
    const form = actionForm({ appointmentId, action: "confirm" });

    await expect(updateDoctorAppointment({}, form)).resolves.toEqual({ error: "Appointment not found." });
    if (!doctorWhere) throw new Error("Expected a doctor ownership condition.");
    const sql = whereSql(doctorWhere);
    expect(sql).toContain('"appointments"."doctor_id"');
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it("requires the database-backed administrator role before reading appointments", async () => {
    mockRequireRole.mockRejectedValue(new Error("not-found"));
    const form = actionForm({ appointmentId, status: "CANCELLED" });

    await expect(setAdminAppointmentStatus({}, form)).rejects.toThrow("not-found");
    expect(mockRequireRole).toHaveBeenCalledWith("ADMIN");
    expect(mockDb.select).not.toHaveBeenCalled();
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { DEMO_DOCTORS, demoDataEnabled } from "../src/features/doctors/demo-data";

afterEach(() => vi.unstubAllEnvs());

describe("development demo data guard", () => {
  it("enables the fictional preview only when the explicit flag is set in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("USE_DEMO_DATA", "true");
    expect(demoDataEnabled()).toBe(true);
  });

  it("never enables fictional profiles in production, even if the flag is set", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("USE_DEMO_DATA", "true");
    expect(demoDataEnabled()).toBe(false);
  });

  it("marks every sample provider as fictional and supplies no credentials", () => {
    expect(DEMO_DOCTORS.length).toBeGreaterThan(0);
    for (const doctor of DEMO_DOCTORS) {
      expect(doctor.isDemo).toBe(true);
      expect(doctor.qualifications).toBeNull();
      expect(doctor.biography).toContain("Fictional sample profile");
    }
  });
});

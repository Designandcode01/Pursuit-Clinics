import { loadEnvConfig } from "@next/env";
import { and, eq } from "drizzle-orm";

loadEnvConfig(process.cwd());

if (process.env.NODE_ENV === "production" || process.env.ALLOW_DEVELOPMENT_SEED !== "true") {
  throw new Error("Set ALLOW_DEVELOPMENT_SEED=true in a development environment before running the seed script.");
}

const { db } = await import("@/db");
const { doctorAvailability, doctorProfiles, specialties, users } = await import("@/db/schema");

const seedSpecialties = [
  { name: "Primary Care", slug: "primary-care", description: "General health and preventive care." },
  { name: "Cardiology", slug: "cardiology", description: "Care for heart and circulatory health." },
  { name: "Dermatology", slug: "dermatology", description: "Care for skin, hair, and nails." },
  { name: "Pediatrics", slug: "pediatrics", description: "Health care for infants, children, and adolescents." },
  { name: "Neurology", slug: "neurology", description: "Care for the brain and nervous system." },
  { name: "Orthopedics", slug: "orthopedics", description: "Care for bones, joints, and movement." },
];

for (const specialty of seedSpecialties) await db.insert(specialties).values(specialty).onConflictDoNothing();

const specialtyRows = await db.select().from(specialties).orderBy(specialties.name);
const specialtyIds = specialtyRows.map((specialty) => specialty.id);
const clerkIds = (process.env.DEMO_DOCTOR_CLERK_USER_IDS ?? "").split(",").map((id) => id.trim()).filter(Boolean);

for (const [index, clerkUserId] of clerkIds.entries()) {
  const [user] = await db.select().from(users).where(eq(users.clerkUserId, clerkUserId)).limit(1);
  if (!user) throw new Error(`The Clerk account ${clerkUserId} has not signed in yet. Complete onboarding before seeding its doctor profile.`);

  const specialtyId = specialtyIds[index % specialtyIds.length];
  if (!specialtyId) throw new Error("No specialties exist to assign to demo providers.");

  if (user.role === "PATIENT") {
    await db.update(users).set({ role: "DOCTOR", updatedAt: new Date() }).where(eq(users.id, user.id));
  } else if (user.role !== "DOCTOR") {
    throw new Error(`Refusing to change the ${user.role} role for ${user.name}.`);
  }
  await db.insert(doctorProfiles).values({
    userId: user.id,
    specialtyId,
    displayName: user.name,
    consultationFee: 500000,
    appointmentDurationMinutes: 30,
    bufferMinutes: 10,
    timezone: "Asia/Karachi",
    isActive: true,
  }).onConflictDoUpdate({
    target: doctorProfiles.userId,
    set: { specialtyId, displayName: user.name, isActive: true, updatedAt: new Date() },
  });

  const [profile] = await db.select({ id: doctorProfiles.id }).from(doctorProfiles).where(eq(doctorProfiles.userId, user.id)).limit(1);
  if (!profile) throw new Error(`Unable to create provider profile for ${user.name}.`);
  for (const dayOfWeek of [1, 2, 3, 4, 5]) {
    const [existing] = await db.select({ id: doctorAvailability.id }).from(doctorAvailability).where(and(
      eq(doctorAvailability.doctorId, profile.id), eq(doctorAvailability.dayOfWeek, dayOfWeek),
      eq(doctorAvailability.startTime, "09:00:00"), eq(doctorAvailability.endTime, "17:00:00"),
    )).limit(1);
    if (!existing) await db.insert(doctorAvailability).values({ doctorId: profile.id, dayOfWeek, startTime: "09:00:00", endTime: "17:00:00", isAvailable: true });
  }
}

console.log(`Seeded ${seedSpecialties.length} specialties and ${clerkIds.length} real Clerk-linked demo provider profile(s).`);

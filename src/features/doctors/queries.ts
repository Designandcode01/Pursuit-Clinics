import "server-only";
import { and, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { doctorProfiles, specialties, users } from "@/db/schema";
import { DEMO_DOCTORS, DEMO_SPECIALTIES, demoDataEnabled } from "@/features/doctors/demo-data";

export const DOCTOR_PAGE_SIZE = 12;

export async function getStoredSpecialties() {
  return db.select({ id: specialties.id, name: specialties.name, slug: specialties.slug, description: specialties.description })
    .from(specialties)
    .orderBy(specialties.name);
}

export async function getSpecialties() {
  const rows = await getStoredSpecialties();
  return !rows.length && demoDataEnabled() ? DEMO_SPECIALTIES : rows;
}

export async function getActiveDoctors(options: { search?: string; specialty?: string; page?: number } = {}) {
  const page = Math.max(1, options.page ?? 1);
  const search = options.search?.trim().slice(0, 100);
  const filters = [eq(doctorProfiles.isActive, true)];

  if (options.specialty) filters.push(eq(specialties.slug, options.specialty));
  if (search) {
    const pattern = `%${search.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`;
    filters.push(or(ilike(doctorProfiles.displayName, pattern), ilike(specialties.name, pattern))!);
  }

  const rows = await db.select({
    id: doctorProfiles.id,
    displayName: doctorProfiles.displayName,
    biography: doctorProfiles.biography,
    qualifications: doctorProfiles.qualifications,
    websiteUrl: doctorProfiles.websiteUrl,
    consultationFee: doctorProfiles.consultationFee,
    appointmentDurationMinutes: doctorProfiles.appointmentDurationMinutes,
    imageUrl: users.imageUrl,
    specialtyName: specialties.name,
    specialtySlug: specialties.slug,
  }).from(doctorProfiles)
    .innerJoin(users, eq(doctorProfiles.userId, users.id))
    .innerJoin(specialties, eq(doctorProfiles.specialtyId, specialties.id))
    .where(and(...filters))
    .orderBy(doctorProfiles.displayName)
    .limit(DOCTOR_PAGE_SIZE + 1)
    .offset((page - 1) * DOCTOR_PAGE_SIZE);

  if (!rows.length && demoDataEnabled()) {
    const normalizedSearch = search?.toLocaleLowerCase();
    const filtered = DEMO_DOCTORS.filter((doctor) =>
      (!options.specialty || doctor.specialtySlug === options.specialty) &&
      (!normalizedSearch || `${doctor.displayName} ${doctor.specialtyName}`.toLocaleLowerCase().includes(normalizedSearch)),
    );
    const start = (page - 1) * DOCTOR_PAGE_SIZE;
    return { doctors: filtered.slice(start, start + DOCTOR_PAGE_SIZE), hasNextPage: filtered.length > start + DOCTOR_PAGE_SIZE, page };
  }
  return { doctors: rows.slice(0, DOCTOR_PAGE_SIZE).map((doctor) => ({ ...doctor, isDemo: false as const })), hasNextPage: rows.length > DOCTOR_PAGE_SIZE, page };
}

export async function getActiveDoctor(doctorId: string) {
  const [doctor] = await db.select({
    id: doctorProfiles.id,
    displayName: doctorProfiles.displayName,
    biography: doctorProfiles.biography,
    qualifications: doctorProfiles.qualifications,
    websiteUrl: doctorProfiles.websiteUrl,
    consultationFee: doctorProfiles.consultationFee,
    appointmentDurationMinutes: doctorProfiles.appointmentDurationMinutes,
    bufferMinutes: doctorProfiles.bufferMinutes,
    timezone: doctorProfiles.timezone,
    imageUrl: users.imageUrl,
    specialtyName: specialties.name,
    specialtySlug: specialties.slug,
  }).from(doctorProfiles)
    .innerJoin(users, eq(doctorProfiles.userId, users.id))
    .innerJoin(specialties, eq(doctorProfiles.specialtyId, specialties.id))
    .where(and(eq(doctorProfiles.id, doctorId), eq(doctorProfiles.isActive, true)))
    .limit(1);

  if (doctor) return { ...doctor, isDemo: false as const };
  return demoDataEnabled() ? DEMO_DOCTORS.find((item) => item.id === doctorId) ?? null : null;
}

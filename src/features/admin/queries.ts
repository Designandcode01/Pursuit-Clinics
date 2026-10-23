import "server-only";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { appointments, doctorProfiles, specialties, users, type Appointment } from "@/db/schema";

function searchPattern(value?: string) {
  const q = value?.trim().slice(0, 100);
  return q ? `%${q.replaceAll("%", "\\%").replaceAll("_", "\\_")}%` : null;
}

export async function getAdminOverview() {
  const [patientCount, activeDoctorCount, appointmentCount, pendingCount, recentBookings] = await Promise.all([
    db.$count(users, eq(users.role, "PATIENT")),
    db.$count(doctorProfiles, eq(doctorProfiles.isActive, true)),
    db.$count(appointments),
    db.$count(appointments, eq(appointments.status, "PENDING")),
    db.select({ id: appointments.id, startAt: appointments.scheduledStartAt, status: appointments.status, patientName: users.name, doctorName: doctorProfiles.displayName, timezone: doctorProfiles.timezone })
      .from(appointments).innerJoin(users, eq(appointments.patientId, users.id)).innerJoin(doctorProfiles, eq(appointments.doctorId, doctorProfiles.id))
      .orderBy(desc(appointments.createdAt)).limit(6),
  ]);
  return { patientCount, activeDoctorCount, appointmentCount, pendingCount, recentBookings };
}

export async function getAdminPatients(search?: string) {
  const pattern = searchPattern(search);
  const conditions = [eq(users.role, "PATIENT")];
  if (pattern) conditions.push(or(ilike(users.name, pattern), ilike(users.email, pattern))!);
  return db.select({ id: users.id, name: users.name, email: users.email, imageUrl: users.imageUrl, createdAt: users.createdAt })
    .from(users).where(and(...conditions)).orderBy(users.name).limit(100);
}

export async function getAdminDoctors(search?: string) {
  const pattern = searchPattern(search);
  const conditions = [];
  if (pattern) conditions.push(or(ilike(doctorProfiles.displayName, pattern), ilike(users.email, pattern), ilike(specialties.name, pattern))!);
  return db.select({ id: doctorProfiles.id, userId: doctorProfiles.userId, clerkUserId: users.clerkUserId, displayName: doctorProfiles.displayName, email: users.email, specialtyId: specialties.id, specialtyName: specialties.name, biography: doctorProfiles.biography, qualifications: doctorProfiles.qualifications, websiteUrl: doctorProfiles.websiteUrl, fee: doctorProfiles.consultationFee, duration: doctorProfiles.appointmentDurationMinutes, buffer: doctorProfiles.bufferMinutes, timezone: doctorProfiles.timezone, isActive: doctorProfiles.isActive })
    .from(doctorProfiles).innerJoin(users, eq(doctorProfiles.userId, users.id)).innerJoin(specialties, eq(doctorProfiles.specialtyId, specialties.id))
    .where(conditions.length ? and(...conditions) : undefined).orderBy(doctorProfiles.displayName).limit(100);
}

export async function getAdminAppointments(options: { search?: string; status?: Appointment["status"] } = {}) {
  const conditions = [];
  const pattern = searchPattern(options.search);
  if (options.status) conditions.push(eq(appointments.status, options.status));
  if (pattern) conditions.push(or(ilike(users.name, pattern), ilike(users.email, pattern), ilike(doctorProfiles.displayName, pattern))!);
  return db.select({
    id: appointments.id, startAt: appointments.scheduledStartAt, endAt: appointments.scheduledEndAt, status: appointments.status,
    patientId: users.id, patientName: users.name, patientEmail: users.email,
    doctorId: doctorProfiles.id, doctorName: doctorProfiles.displayName, specialty: specialties.name, timezone: doctorProfiles.timezone,
    reason: appointments.reasonForVisit,
  }).from(appointments).innerJoin(users, eq(appointments.patientId, users.id))
    .innerJoin(doctorProfiles, eq(appointments.doctorId, doctorProfiles.id))
    .innerJoin(specialties, eq(doctorProfiles.specialtyId, specialties.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(appointments.scheduledStartAt)).limit(100);
}

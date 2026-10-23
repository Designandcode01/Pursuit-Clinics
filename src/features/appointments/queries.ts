import "server-only";
import { and, desc, eq, gte, inArray, lt } from "drizzle-orm";
import { db } from "@/db";
import { appointments, doctorProfiles, specialties, users, type Appointment } from "@/db/schema";
import { localDateAt, localDayInterval } from "@/features/availability/timezone";
import { canDoctorApplyAction, canPatientCancel } from "@/features/appointments/policy";

const activeStatuses: Appointment["status"][] = ["PENDING", "CONFIRMED"];

export async function getPatientAppointments(patientId: string, status?: Appointment["status"], range: "upcoming" | "past" | "all" = "all") {
  const filters = [eq(appointments.patientId, patientId)];
  if (status) filters.push(eq(appointments.status, status));
  const now = new Date();
  if (range === "upcoming") {
    filters.push(gte(appointments.scheduledStartAt, now));
    if (!status) filters.push(inArray(appointments.status, activeStatuses));
  }
  if (range === "past") filters.push(lt(appointments.scheduledStartAt, now));
  const rows = await db.select({
    id: appointments.id, scheduledStartAt: appointments.scheduledStartAt, scheduledEndAt: appointments.scheduledEndAt,
    status: appointments.status, reasonForVisit: appointments.reasonForVisit, cancellationReason: appointments.cancellationReason,
    doctorId: doctorProfiles.id, doctorName: doctorProfiles.displayName, specialtyName: specialties.name, timezone: doctorProfiles.timezone,
  }).from(appointments)
    .innerJoin(doctorProfiles, eq(appointments.doctorId, doctorProfiles.id))
    .innerJoin(specialties, eq(doctorProfiles.specialtyId, specialties.id))
    .where(and(...filters)).orderBy(desc(appointments.scheduledStartAt)).limit(100);
  return rows.map((appointment) => ({ ...appointment, canCancel: canPatientCancel(appointment.status, appointment.scheduledStartAt, now) }));
}

export async function getPatientAppointment(patientId: string, appointmentId: string) {
  const [appointment] = await db.select({
    id: appointments.id, scheduledStartAt: appointments.scheduledStartAt, scheduledEndAt: appointments.scheduledEndAt,
    status: appointments.status, reasonForVisit: appointments.reasonForVisit, patientNotes: appointments.patientNotes,
    cancellationReason: appointments.cancellationReason, cancelledAt: appointments.cancelledAt,
    doctorId: doctorProfiles.id, doctorName: doctorProfiles.displayName, specialtyName: specialties.name,
    qualifications: doctorProfiles.qualifications, consultationFee: doctorProfiles.consultationFee, timezone: doctorProfiles.timezone,
  }).from(appointments)
    .innerJoin(doctorProfiles, eq(appointments.doctorId, doctorProfiles.id))
    .innerJoin(specialties, eq(doctorProfiles.specialtyId, specialties.id))
    .where(and(eq(appointments.id, appointmentId), eq(appointments.patientId, patientId))).limit(1);
  return appointment ? { ...appointment, canCancel: canPatientCancel(appointment.status, appointment.scheduledStartAt, new Date()) } : null;
}

export async function getPatientDashboardSummary(patientId: string) {
  const now = new Date();
  const [upcoming, recentAppointments, upcomingCount] = await Promise.all([
    db.select({
      id: appointments.id, scheduledStartAt: appointments.scheduledStartAt, scheduledEndAt: appointments.scheduledEndAt,
      status: appointments.status, doctorId: doctorProfiles.id, doctorName: doctorProfiles.displayName, specialtyName: specialties.name, timezone: doctorProfiles.timezone,
    }).from(appointments).innerJoin(doctorProfiles, eq(appointments.doctorId, doctorProfiles.id))
      .innerJoin(specialties, eq(doctorProfiles.specialtyId, specialties.id))
      .where(and(eq(appointments.patientId, patientId), inArray(appointments.status, activeStatuses), gte(appointments.scheduledStartAt, now)))
      .orderBy(appointments.scheduledStartAt).limit(1),
    db.select({
      id: appointments.id, scheduledStartAt: appointments.scheduledStartAt, scheduledEndAt: appointments.scheduledEndAt,
      status: appointments.status, doctorId: doctorProfiles.id, doctorName: doctorProfiles.displayName, specialtyName: specialties.name, timezone: doctorProfiles.timezone,
    }).from(appointments).innerJoin(doctorProfiles, eq(appointments.doctorId, doctorProfiles.id))
      .innerJoin(specialties, eq(doctorProfiles.specialtyId, specialties.id))
      .where(and(eq(appointments.patientId, patientId), lt(appointments.scheduledStartAt, now)))
      .orderBy(desc(appointments.scheduledStartAt)).limit(4),
    db.$count(appointments, and(eq(appointments.patientId, patientId), inArray(appointments.status, activeStatuses), gte(appointments.scheduledStartAt, now))),
  ]);
  return { nextAppointment: upcoming[0] ?? null, recentAppointments, upcomingCount };
}

export async function getDoctorAppointments(doctorId: string, status?: Appointment["status"]) {
  const filters = [eq(appointments.doctorId, doctorId)];
  if (status) filters.push(eq(appointments.status, status));
  const rows = await db.select({
    id: appointments.id, scheduledStartAt: appointments.scheduledStartAt, scheduledEndAt: appointments.scheduledEndAt,
    status: appointments.status, reasonForVisit: appointments.reasonForVisit, patientNotes: appointments.patientNotes,
    patientName: users.name, patientEmail: users.email, timezone: doctorProfiles.timezone,
  }).from(appointments).innerJoin(users, eq(appointments.patientId, users.id))
    .innerJoin(doctorProfiles, eq(appointments.doctorId, doctorProfiles.id))
    .where(and(...filters)).orderBy(desc(appointments.scheduledStartAt)).limit(100);
  const now = new Date();
  return rows.map((appointment) => ({
    ...appointment,
    canConfirm: canDoctorApplyAction(appointment.status, "confirm", appointment.scheduledStartAt, appointment.scheduledEndAt, now),
    canReject: canDoctorApplyAction(appointment.status, "reject", appointment.scheduledStartAt, appointment.scheduledEndAt, now),
    canComplete: canDoctorApplyAction(appointment.status, "complete", appointment.scheduledStartAt, appointment.scheduledEndAt, now),
    canCancel: canDoctorApplyAction(appointment.status, "cancel", appointment.scheduledStartAt, appointment.scheduledEndAt, now),
  }));
}

export async function getDoctorDashboardSummary(doctorId: string) {
  const now = new Date();
  const [doctor] = await db.select({ timezone: doctorProfiles.timezone }).from(doctorProfiles).where(eq(doctorProfiles.id, doctorId)).limit(1);
  const localDay = doctor ? localDayInterval(localDateAt(now, doctor.timezone), doctor.timezone) : null;
  if (!localDay) return { today: [], recentAppointments: [], upcomingCount: 0, pendingCount: 0 };
  const [today, recentAppointments, upcomingCount, pendingCount] = await Promise.all([
    db.select({
      id: appointments.id, scheduledStartAt: appointments.scheduledStartAt, scheduledEndAt: appointments.scheduledEndAt,
      status: appointments.status, patientName: users.name, timezone: doctorProfiles.timezone,
    }).from(appointments).innerJoin(users, eq(appointments.patientId, users.id))
      .innerJoin(doctorProfiles, eq(appointments.doctorId, doctorProfiles.id))
      .where(and(eq(appointments.doctorId, doctorId), inArray(appointments.status, activeStatuses), gte(appointments.scheduledStartAt, localDay.start), lt(appointments.scheduledStartAt, localDay.end)))
      .orderBy(appointments.scheduledStartAt).limit(20),
    db.select({
      id: appointments.id, scheduledStartAt: appointments.scheduledStartAt, scheduledEndAt: appointments.scheduledEndAt,
      status: appointments.status, patientName: users.name, timezone: doctorProfiles.timezone,
    }).from(appointments).innerJoin(users, eq(appointments.patientId, users.id))
      .innerJoin(doctorProfiles, eq(appointments.doctorId, doctorProfiles.id))
      .where(and(eq(appointments.doctorId, doctorId), lt(appointments.scheduledStartAt, now)))
      .orderBy(desc(appointments.scheduledStartAt)).limit(4),
    db.$count(appointments, and(eq(appointments.doctorId, doctorId), inArray(appointments.status, activeStatuses), gte(appointments.scheduledStartAt, now))),
    db.$count(appointments, and(eq(appointments.doctorId, doctorId), eq(appointments.status, "PENDING"))),
  ]);
  return { today, recentAppointments, upcomingCount, pendingCount };
}

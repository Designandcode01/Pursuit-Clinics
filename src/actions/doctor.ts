"use server";

import { and, eq, gt, inArray, lt } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { appointments, doctorAvailability, doctorProfiles, doctorTimeOff } from "@/db/schema";
import { localDateTimeToInstant } from "@/features/availability/timezone";
import { canDoctorApplyAction } from "@/features/appointments/policy";
import { requireDoctorProfile } from "@/lib/auth/doctor";

export type DoctorActionState = { error?: string; success?: string };

const appointmentActionSchema = z.object({
  appointmentId: z.string().uuid(),
  action: z.enum(["confirm", "reject", "complete", "cancel"]),
  reason: z.string().trim().max(500).optional(),
});

export async function updateDoctorAppointment(_previous: DoctorActionState, formData: FormData): Promise<DoctorActionState> {
  const parsed = appointmentActionSchema.safeParse({ appointmentId: formData.get("appointmentId"), action: formData.get("action"), reason: formData.get("reason") || undefined });
  if (!parsed.success) return { error: "Invalid appointment update." };
  const { profile } = await requireDoctorProfile();
  const [appointment] = await db.select().from(appointments).where(and(eq(appointments.id, parsed.data.appointmentId), eq(appointments.doctorId, profile.id))).limit(1);
  if (!appointment) return { error: "Appointment not found." };

  const now = new Date();
  const nextStatus = { confirm: "CONFIRMED", reject: "REJECTED", complete: "COMPLETED", cancel: "CANCELLED" } as const;
  const allowed = canDoctorApplyAction(appointment.status, parsed.data.action, appointment.scheduledStartAt, appointment.scheduledEndAt, now);
  if (!allowed) return { error: "This appointment cannot be changed to that status." };

  const [updated] = await db.update(appointments).set({
    status: nextStatus[parsed.data.action],
    cancellationReason: ["reject", "cancel"].includes(parsed.data.action) ? parsed.data.reason || null : appointment.cancellationReason,
    cancelledAt: parsed.data.action === "cancel" ? now : appointment.cancelledAt,
    updatedAt: now,
  }).where(and(eq(appointments.id, appointment.id), eq(appointments.doctorId, profile.id), eq(appointments.status, appointment.status))).returning({ id: appointments.id });
  if (!updated) return { error: "The appointment changed before the update completed. Refresh and try again." };

  revalidatePath("/doctor/dashboard");
  revalidatePath("/doctor/appointments");
  revalidatePath("/patient/dashboard");
  revalidatePath("/patient/appointments");
  revalidatePath(`/patient/appointments/${appointment.id}`);
  const actionLabel = { confirm: "confirmed", reject: "rejected", complete: "completed", cancel: "cancelled" }[parsed.data.action];
  return { success: `Appointment ${actionLabel}.` };
}

const profileSchema = z.object({
  displayName: z.string().trim().min(2).max(200),
  biography: z.string().trim().max(5000).optional(),
  qualifications: z.string().trim().max(1000).optional(),
  appointmentDurationMinutes: z.coerce.number().int().min(15).max(120),
  bufferMinutes: z.coerce.number().int().min(0).max(60),
});

export async function updateDoctorProfile(_previous: DoctorActionState, formData: FormData): Promise<DoctorActionState> {
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Check the profile fields and try again." };
  const { profile } = await requireDoctorProfile();
  await db.update(doctorProfiles).set({
    displayName: parsed.data.displayName,
    biography: parsed.data.biography || null,
    qualifications: parsed.data.qualifications || null,
    appointmentDurationMinutes: parsed.data.appointmentDurationMinutes,
    bufferMinutes: parsed.data.bufferMinutes,
    updatedAt: new Date(),
  }).where(eq(doctorProfiles.id, profile.id));
  revalidatePath("/doctor/profile");
  revalidatePath("/doctors");
  return { success: "Professional profile saved." };
}

const availabilitySchema = z.object({
  availabilityId: z.string().uuid().optional(),
  dayOfWeek: z.coerce.number().int().min(1).max(7),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  isAvailable: z.enum(["true", "false"]),
}).refine((value) => value.endTime > value.startTime, { path: ["endTime"], message: "End time must be after start time." });

export async function saveDoctorAvailability(_previous: DoctorActionState, formData: FormData): Promise<DoctorActionState> {
  const parsed = availabilitySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Provide a valid weekly time range." };
  const { profile } = await requireDoctorProfile();
  const values = { dayOfWeek: parsed.data.dayOfWeek, startTime: `${parsed.data.startTime}:00`, endTime: `${parsed.data.endTime}:00`, isAvailable: parsed.data.isAvailable === "true", updatedAt: new Date() };
  if (parsed.data.availabilityId) {
    const [updated] = await db.update(doctorAvailability).set(values).where(and(eq(doctorAvailability.id, parsed.data.availabilityId), eq(doctorAvailability.doctorId, profile.id))).returning({ id: doctorAvailability.id });
    if (!updated) return { error: "Availability entry not found." };
  } else {
    await db.insert(doctorAvailability).values({ ...values, doctorId: profile.id });
  }
  revalidatePath("/doctor/availability");
  revalidatePath(`/doctors/${profile.id}`);
  return { success: "Weekly availability saved." };
}

const deleteAvailabilitySchema = z.object({ availabilityId: z.string().uuid() });
export async function deleteDoctorAvailability(_previous: DoctorActionState, formData: FormData): Promise<DoctorActionState> {
  const parsed = deleteAvailabilitySchema.safeParse({ availabilityId: formData.get("availabilityId") });
  if (!parsed.success) return { error: "Availability entry not found." };
  const { profile } = await requireDoctorProfile();
  await db.delete(doctorAvailability).where(and(eq(doctorAvailability.id, parsed.data.availabilityId), eq(doctorAvailability.doctorId, profile.id)));
  revalidatePath("/doctor/availability");
  return { success: "Availability removed." };
}

const timeOffSchema = z.object({ startLocal: z.string(), endLocal: z.string(), reason: z.string().trim().max(500).optional() });
export async function addDoctorTimeOff(_previous: DoctorActionState, formData: FormData): Promise<DoctorActionState> {
  const parsed = timeOffSchema.safeParse({ startLocal: formData.get("startLocal"), endLocal: formData.get("endLocal"), reason: formData.get("reason") || undefined });
  if (!parsed.success) return { error: "Provide a start and end time for the blocked period." };
  const { profile } = await requireDoctorProfile();
  const startAt = localDateTimeToInstant(parsed.data.startLocal, profile.timezone);
  const endAt = localDateTimeToInstant(parsed.data.endLocal, profile.timezone);
  if (!startAt || !endAt || endAt <= startAt || startAt <= new Date()) return { error: "The time range is invalid, in the past, or falls in a daylight-saving gap." };
  const [conflict] = await db.select({ id: appointments.id }).from(appointments).where(and(
    eq(appointments.doctorId, profile.id), inArray(appointments.status, ["PENDING", "CONFIRMED"]),
    lt(appointments.scheduledStartAt, endAt), gt(appointments.scheduledEndAt, startAt),
  )).limit(1);
  if (conflict) return { error: "This blocked period overlaps a pending or confirmed appointment. Reschedule it before adding time off." };
  await db.insert(doctorTimeOff).values({ doctorId: profile.id, startAt, endAt, reason: parsed.data.reason || null });
  revalidatePath("/doctor/availability");
  return { success: "Time off added." };
}

export async function deleteDoctorTimeOff(_previous: DoctorActionState, formData: FormData): Promise<DoctorActionState> {
  const parsed = deleteAvailabilitySchema.safeParse({ availabilityId: formData.get("timeOffId") });
  if (!parsed.success) return { error: "Blocked time not found." };
  const { profile } = await requireDoctorProfile();
  await db.delete(doctorTimeOff).where(and(eq(doctorTimeOff.id, parsed.data.availabilityId), eq(doctorTimeOff.doctorId, profile.id)));
  revalidatePath("/doctor/availability");
  return { success: "Blocked time removed." };
}

"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { appointments, doctorProfiles, specialties, users } from "@/db/schema";
import { requireRole } from "@/lib/auth/user";
import { canAdminSetAppointmentStatus } from "@/features/appointments/policy";
import type { DoctorActionState } from "@/actions/doctor";

const doctorSchema = z.object({
  clerkUserId: z.string().trim().min(3).max(255),
  specialtyId: z.string().uuid(),
  displayName: z.string().trim().min(2).max(200),
  biography: z.string().trim().max(5000).optional(),
  qualifications: z.string().trim().max(1000).optional(),
  websiteUrl: z.union([z.literal(""), z.string().trim().max(2048).refine((value) => {
    try {
      const url = new URL(value);
      return url.protocol === "https:" || url.protocol === "http:";
    } catch {
      return false;
    }
  }, "Enter a valid http or https website URL.")]).optional(),
  // The form takes PKR; store the fee as paisa (minor units) in the database.
  consultationFee: z.coerce.number().min(0).max(1_000_000).transform((amount) => Math.round(amount * 100)),
  appointmentDurationMinutes: z.coerce.number().int().min(15).max(120),
  bufferMinutes: z.coerce.number().int().min(0).max(60),
  timezone: z.string().trim().min(1).max(64),
  isActive: z.enum(["true", "false"]),
});

export async function saveAdminDoctor(_previous: DoctorActionState, formData: FormData): Promise<DoctorActionState> {
  const parsed = doctorSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Check the provider fields and try again." };
  await requireRole("ADMIN");
  try { new Intl.DateTimeFormat("en", { timeZone: parsed.data.timezone }); } catch { return { error: "Enter a valid IANA timezone, such as Asia/Karachi." }; }

  const [user] = await db.select().from(users).where(eq(users.clerkUserId, parsed.data.clerkUserId)).limit(1);
  if (!user) return { error: "That Clerk account must sign in and complete onboarding before a profile can be assigned." };
  if (user.role === "ADMIN") return { error: "Administrator accounts cannot be assigned as doctors." };
  const [specialty] = await db.select({ id: specialties.id }).from(specialties).where(eq(specialties.id, parsed.data.specialtyId)).limit(1);
  if (!specialty) return { error: "Select an existing specialty." };

  if (user.role === "PATIENT") await db.update(users).set({ role: "DOCTOR", updatedAt: new Date() }).where(eq(users.id, user.id));
  await db.insert(doctorProfiles).values({
    userId: user.id, specialtyId: specialty.id, displayName: parsed.data.displayName,
    biography: parsed.data.biography || null, qualifications: parsed.data.qualifications || null, websiteUrl: parsed.data.websiteUrl || null,
    consultationFee: parsed.data.consultationFee, appointmentDurationMinutes: parsed.data.appointmentDurationMinutes,
    bufferMinutes: parsed.data.bufferMinutes, timezone: parsed.data.timezone, isActive: parsed.data.isActive === "true",
  }).onConflictDoUpdate({ target: doctorProfiles.userId, set: {
    specialtyId: specialty.id, displayName: parsed.data.displayName, biography: parsed.data.biography || null,
    qualifications: parsed.data.qualifications || null, websiteUrl: parsed.data.websiteUrl || null, consultationFee: parsed.data.consultationFee,
    appointmentDurationMinutes: parsed.data.appointmentDurationMinutes, bufferMinutes: parsed.data.bufferMinutes,
    timezone: parsed.data.timezone, isActive: parsed.data.isActive === "true", updatedAt: new Date(),
  } });
  revalidatePath("/admin/doctors");
  revalidatePath("/doctors");
  return { success: "Provider profile saved." };
}

const doctorActivationSchema = z.object({ doctorId: z.string().uuid(), isActive: z.enum(["true", "false"]) });
export async function setDoctorActiveStatus(_previous: DoctorActionState, formData: FormData): Promise<DoctorActionState> {
  const parsed = doctorActivationSchema.safeParse({ doctorId: formData.get("doctorId"), isActive: formData.get("isActive") });
  if (!parsed.success) return { error: "Invalid provider status update." };
  await requireRole("ADMIN");
  const [updated] = await db.update(doctorProfiles).set({ isActive: parsed.data.isActive === "true", updatedAt: new Date() }).where(eq(doctorProfiles.id, parsed.data.doctorId)).returning({ id: doctorProfiles.id });
  if (!updated) return { error: "Provider not found." };
  revalidatePath("/admin/doctors");
  revalidatePath("/doctors");
  return { success: "Provider status updated." };
}

const specialtySchema = z.object({ name: z.string().trim().min(2).max(120), slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(140), description: z.string().trim().max(1000).optional() });
export async function createSpecialty(_previous: DoctorActionState, formData: FormData): Promise<DoctorActionState> {
  const parsed = specialtySchema.safeParse({ name: formData.get("name"), slug: formData.get("slug"), description: formData.get("description") || undefined });
  if (!parsed.success) return { error: "Provide a valid specialty name and URL slug." };
  await requireRole("ADMIN");
  try {
    await db.insert(specialties).values({ name: parsed.data.name, slug: parsed.data.slug, description: parsed.data.description || null });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "23505") return { error: "That specialty name or slug already exists." };
    throw error;
  }
  revalidatePath("/admin/specialties");
  revalidatePath("/doctors");
  revalidatePath("/");
  return { success: "Specialty added." };
}

const adminAppointmentSchema = z.object({ appointmentId: z.string().uuid(), status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "REJECTED"]) });
export async function setAdminAppointmentStatus(_previous: DoctorActionState, formData: FormData): Promise<DoctorActionState> {
  const parsed = adminAppointmentSchema.safeParse({ appointmentId: formData.get("appointmentId"), status: formData.get("status") });
  if (!parsed.success) return { error: "Invalid appointment status." };
  await requireRole("ADMIN");
  const [current] = await db.select().from(appointments).where(eq(appointments.id, parsed.data.appointmentId)).limit(1);
  if (!current) return { error: "Appointment not found." };
  const canTransition = canAdminSetAppointmentStatus(current.status, parsed.data.status, current.scheduledStartAt, current.scheduledEndAt, new Date());
  if (!canTransition) return { error: "This appointment status transition is not allowed." };
  try {
    const [updated] = await db.update(appointments).set({ status: parsed.data.status, updatedAt: new Date(), cancelledAt: parsed.data.status === "CANCELLED" ? new Date() : null })
      .where(and(eq(appointments.id, current.id), eq(appointments.status, current.status))).returning({ id: appointments.id });
    if (!updated) return { error: "This appointment changed before the update completed. Refresh and try again." };
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "23P01") return { error: "That status would create an overlapping doctor booking." };
    throw error;
  }
  revalidatePath("/admin/appointments");
  revalidatePath("/admin/dashboard");
  revalidatePath("/patient/appointments");
  revalidatePath("/doctor/appointments");
  return { success: "Appointment status updated." };
}

const specialtyEditSchema = specialtySchema.extend({ specialtyId: z.string().uuid() });
export async function updateSpecialty(_previous: DoctorActionState, formData: FormData): Promise<DoctorActionState> {
  const parsed = specialtyEditSchema.safeParse({ specialtyId: formData.get("specialtyId"), name: formData.get("name"), slug: formData.get("slug"), description: formData.get("description") || undefined });
  if (!parsed.success) return { error: "Provide a valid specialty name and URL slug." };
  await requireRole("ADMIN");
  try {
    const [updated] = await db.update(specialties).set({ name: parsed.data.name, slug: parsed.data.slug, description: parsed.data.description || null })
      .where(eq(specialties.id, parsed.data.specialtyId)).returning({ id: specialties.id });
    if (!updated) return { error: "Specialty not found." };
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "23505") return { error: "That specialty name or slug already exists." };
    throw error;
  }
  revalidatePath("/admin/specialties");
  revalidatePath("/doctors");
  revalidatePath("/");
  return { success: "Specialty updated." };
}

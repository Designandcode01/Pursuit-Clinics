"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { and, eq, gte, inArray } from "drizzle-orm";
import { db } from "@/db";
import { appointments, doctorProfiles } from "@/db/schema";
import { getAvailableSlots } from "@/features/availability/service";
import { localDateAt } from "@/features/availability/timezone";
import { requireRole } from "@/lib/auth/user";
import { canPatientCancel } from "@/features/appointments/policy";

const bookingSchema = z.object({
  doctorId: z.string().uuid(),
  scheduledStartAt: z.string().datetime({ offset: true }),
  reasonForVisit: z.string().trim().max(500).optional(),
});

export type BookingActionState = { error?: string };

function isOverlapConstraint(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  if ("code" in error && error.code === "23P01") return true;
  if ("cause" in error) return isOverlapConstraint(error.cause);
  return false;
}

export async function bookAppointment(_previous: BookingActionState, formData: FormData): Promise<BookingActionState> {
  const parsed = bookingSchema.safeParse({
    doctorId: formData.get("doctorId"),
    scheduledStartAt: formData.get("scheduledStartAt"),
    reasonForVisit: formData.get("reasonForVisit") || undefined,
  });
  if (!parsed.success) return { error: "Please select a valid appointment time." };

  const patient = await requireRole("PATIENT");
  const [doctor] = await db.select({ id: doctorProfiles.id, timezone: doctorProfiles.timezone })
    .from(doctorProfiles)
    .where(and(eq(doctorProfiles.id, parsed.data.doctorId), eq(doctorProfiles.isActive, true))).limit(1);
  if (!doctor) return { error: "This doctor is not available for booking." };

  const requestedStart = new Date(parsed.data.scheduledStartAt);
  const localDate = localDateAt(requestedStart, doctor.timezone);
  const slots = await getAvailableSlots(doctor.id, localDate);
  const selected = slots.find((slot) => slot.startAt === requestedStart.toISOString());
  if (!selected) return { error: "That time was just taken or is no longer bookable. Choose another slot." };

  try {
    const [appointment] = await db.insert(appointments).values({
      patientId: patient.id,
      doctorId: doctor.id,
      scheduledStartAt: new Date(selected.startAt),
      scheduledEndAt: new Date(selected.endAt),
      status: "PENDING",
      reasonForVisit: parsed.data.reasonForVisit || null,
    }).returning({ id: appointments.id });

    if (!appointment) return { error: "We could not save this appointment. Please try again." };
    revalidatePath("/patient/appointments");
    redirect(`/patient/appointments/${appointment.id}`);
  } catch (error) {
    if (isOverlapConstraint(error)) return { error: "That time was just taken. Choose another available slot." };
    throw error;
  }
}

const cancelSchema = z.object({ appointmentId: z.string().uuid(), reason: z.string().trim().max(500).optional() });

export async function cancelPatientAppointment(_previous: BookingActionState, formData: FormData): Promise<BookingActionState> {
  const parsed = cancelSchema.safeParse({ appointmentId: formData.get("appointmentId"), reason: formData.get("reason") || undefined });
  if (!parsed.success) return { error: "This appointment cannot be cancelled." };
  const patient = await requireRole("PATIENT");
  const cutoff = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const [existing] = await db.select({ status: appointments.status, scheduledStartAt: appointments.scheduledStartAt }).from(appointments)
    .where(and(eq(appointments.id, parsed.data.appointmentId), eq(appointments.patientId, patient.id))).limit(1);
  if (!existing || !canPatientCancel(existing.status, existing.scheduledStartAt, new Date())) return { error: "This appointment is no longer eligible for cancellation." };
  const [updated] = await db.update(appointments).set({
    status: "CANCELLED", cancellationReason: parsed.data.reason || null, cancelledAt: new Date(), updatedAt: new Date(),
  }).where(and(
    eq(appointments.id, parsed.data.appointmentId), eq(appointments.patientId, patient.id),
    inArray(appointments.status, ["PENDING", "CONFIRMED"]), gte(appointments.scheduledStartAt, cutoff),
  )).returning({ id: appointments.id });

  if (!updated) return { error: "This appointment is no longer eligible for cancellation." };
  revalidatePath("/patient/dashboard");
  revalidatePath("/patient/appointments");
  redirect("/patient/appointments");
}

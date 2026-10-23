import "server-only";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { doctorProfiles } from "@/db/schema";
import { requireRole } from "@/lib/auth/user";

export async function requireDoctorProfile() {
  const user = await requireRole("DOCTOR");
  const [profile] = await db.select().from(doctorProfiles).where(eq(doctorProfiles.userId, user.id)).limit(1);
  if (!profile) notFound();
  return { user, profile };
}

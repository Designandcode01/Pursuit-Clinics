import {
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  time,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
  text,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

export const userRole = pgEnum("user_role", ["PATIENT", "DOCTOR", "ADMIN"]);
export const appointmentStatus = pgEnum("appointment_status", [
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
  "REJECTED",
]);

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clerkUserId: varchar("clerk_user_id", { length: 255 }).notNull(),
    name: varchar("name", { length: 200 }).notNull(),
    email: varchar("email", { length: 320 }).notNull(),
    role: userRole("role").notNull().default("PATIENT"),
    imageUrl: text("image_url"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("users_clerk_user_id_uq").on(table.clerkUserId),
    uniqueIndex("users_email_uq").on(sql`lower(${table.email})`),
    index("users_role_idx").on(table.role),
  ],
);

export const specialties = pgTable(
  "specialties",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 120 }).notNull(),
    slug: varchar("slug", { length: 140 }).notNull(),
    description: text("description"),
    createdAt: createdAt(),
  },
  (table) => [uniqueIndex("specialties_name_uq").on(sql`lower(${table.name})`), uniqueIndex("specialties_slug_uq").on(table.slug)],
);

export const doctorProfiles = pgTable(
  "doctor_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
    specialtyId: uuid("specialty_id").notNull().references(() => specialties.id, { onDelete: "restrict" }),
    displayName: varchar("display_name", { length: 200 }).notNull(),
    biography: text("biography"),
    qualifications: text("qualifications"),
    websiteUrl: varchar("website_url", { length: 2048 }),
    consultationFee: integer("consultation_fee_minor").notNull().default(0),
    appointmentDurationMinutes: integer("appointment_duration_minutes").notNull().default(30),
    bufferMinutes: integer("buffer_minutes").notNull().default(0),
    /** IANA timezone used for weekly local-time availability and slot display. */
    timezone: varchar("timezone", { length: 64 }).notNull().default("UTC"),
    isActive: boolean("is_active").notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("doctor_profiles_user_id_uq").on(table.userId),
    index("doctor_profiles_active_specialty_idx").on(table.isActive, table.specialtyId),
    check("doctor_profiles_fee_nonnegative_ck", sql`${table.consultationFee} >= 0`),
    check("doctor_profiles_duration_positive_ck", sql`${table.appointmentDurationMinutes} > 0`),
    check("doctor_profiles_buffer_nonnegative_ck", sql`${table.bufferMinutes} >= 0`),
  ],
);

export const appointments = pgTable(
  "appointments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    patientId: uuid("patient_id").notNull().references(() => users.id, { onDelete: "restrict" }),
    doctorId: uuid("doctor_id").notNull().references(() => doctorProfiles.id, { onDelete: "restrict" }),
    scheduledStartAt: timestamp("scheduled_start_at", { withTimezone: true }).notNull(),
    scheduledEndAt: timestamp("scheduled_end_at", { withTimezone: true }).notNull(),
    status: appointmentStatus("status").notNull().default("PENDING"),
    reasonForVisit: varchar("reason_for_visit", { length: 500 }),
    patientNotes: text("patient_notes"),
    cancellationReason: varchar("cancellation_reason", { length: 500 }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("appointments_patient_start_idx").on(table.patientId, table.scheduledStartAt),
    index("appointments_doctor_start_idx").on(table.doctorId, table.scheduledStartAt),
    index("appointments_status_start_idx").on(table.status, table.scheduledStartAt),
    check("appointments_positive_interval_ck", sql`${table.scheduledEndAt} > ${table.scheduledStartAt}`),
  ],
);

export const doctorAvailability = pgTable(
  "doctor_availability",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    doctorId: uuid("doctor_id").notNull().references(() => doctorProfiles.id, { onDelete: "cascade" }),
    /** ISO weekday: Monday=1 through Sunday=7. Times are local to doctorProfiles.timezone. */
    dayOfWeek: integer("day_of_week").notNull(),
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    isAvailable: boolean("is_available").notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("doctor_availability_doctor_day_idx").on(table.doctorId, table.dayOfWeek),
    check("doctor_availability_day_ck", sql`${table.dayOfWeek} between 1 and 7`),
    check("doctor_availability_time_ck", sql`${table.endTime} > ${table.startTime}`),
  ],
);

export const doctorTimeOff = pgTable(
  "doctor_time_off",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    doctorId: uuid("doctor_id").notNull().references(() => doctorProfiles.id, { onDelete: "cascade" }),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }).notNull(),
    reason: varchar("reason", { length: 500 }),
    createdAt: createdAt(),
  },
  (table) => [
    index("doctor_time_off_doctor_interval_idx").on(table.doctorId, table.startAt, table.endAt),
    check("doctor_time_off_interval_ck", sql`${table.endAt} > ${table.startAt}`),
  ],
);

export const publicRateLimits = pgTable(
  "public_rate_limits",
  {
    key: varchar("key", { length: 64 }).primaryKey(),
    windowStartedAt: timestamp("window_started_at", { withTimezone: true }).notNull(),
    requestCount: integer("request_count").notNull(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("public_rate_limits_updated_at_idx").on(table.updatedAt),
    check("public_rate_limits_count_positive_ck", sql`${table.requestCount} >= 1`),
  ],
);

export const usersRelations = relations(users, ({ one, many }) => ({
  doctorProfile: one(doctorProfiles), patientAppointments: many(appointments),
}));
export const specialtiesRelations = relations(specialties, ({ many }) => ({ doctors: many(doctorProfiles) }));
export const doctorProfilesRelations = relations(doctorProfiles, ({ one, many }) => ({
  user: one(users, { fields: [doctorProfiles.userId], references: [users.id] }),
  specialty: one(specialties, { fields: [doctorProfiles.specialtyId], references: [specialties.id] }),
  appointments: many(appointments), availability: many(doctorAvailability), timeOff: many(doctorTimeOff),
}));
export const appointmentsRelations = relations(appointments, ({ one }) => ({
  patient: one(users, { fields: [appointments.patientId], references: [users.id] }),
  doctor: one(doctorProfiles, { fields: [appointments.doctorId], references: [doctorProfiles.id] }),
}));
export const doctorAvailabilityRelations = relations(doctorAvailability, ({ one }) => ({
  doctor: one(doctorProfiles, { fields: [doctorAvailability.doctorId], references: [doctorProfiles.id] }),
}));
export const doctorTimeOffRelations = relations(doctorTimeOff, ({ one }) => ({
  doctor: one(doctorProfiles, { fields: [doctorTimeOff.doctorId], references: [doctorProfiles.id] }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type DoctorProfile = typeof doctorProfiles.$inferSelect;
export type Appointment = typeof appointments.$inferSelect;

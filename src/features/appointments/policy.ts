import type { Appointment } from "@/db/schema";

export type DoctorAppointmentAction = "confirm" | "reject" | "complete" | "cancel";
const ACTIVE_STATUSES: Appointment["status"][] = ["PENDING", "CONFIRMED"];

export function canPatientCancel(status: Appointment["status"], startsAt: Date, now: Date): boolean {
  return ACTIVE_STATUSES.includes(status) && startsAt.getTime() >= now.getTime() + 24 * 60 * 60 * 1000;
}

export function canDoctorApplyAction(
  status: Appointment["status"], action: DoctorAppointmentAction,
  startsAt: Date, endsAt: Date, now: Date,
): boolean {
  switch (action) {
    case "confirm":
    case "reject": return status === "PENDING" && startsAt > now;
    case "complete": return status === "CONFIRMED" && endsAt <= now;
    case "cancel": return ACTIVE_STATUSES.includes(status) && startsAt > now;
  }
}

export function canAdminSetAppointmentStatus(
  status: Appointment["status"], next: Appointment["status"], startsAt: Date, endsAt: Date, now: Date,
): boolean {
  switch (next) {
    case "CONFIRMED": return (status === "PENDING" || status === "CONFIRMED") && startsAt > now;
    case "REJECTED": return status === "PENDING" && startsAt > now;
    case "CANCELLED": return ACTIVE_STATUSES.includes(status) && startsAt > now;
    case "COMPLETED": return status === "CONFIRMED" && endsAt <= now;
    case "PENDING": return false;
  }
}

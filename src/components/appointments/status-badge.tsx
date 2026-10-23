import type { Appointment } from "@/db/schema";

const styles: Record<Appointment["status"], string> = {
  PENDING: "border-[#69562e] bg-[#2c2415] text-[#e3c577]",
  CONFIRMED: "border-[#285947] bg-[#14271f] text-[#75d6a7]",
  COMPLETED: "border-[#31506a] bg-[#172532] text-[#9dc8e8]",
  CANCELLED: "border-[#63383b] bg-[#2b191b] text-[#f08a8e]",
  REJECTED: "border-[#63383b] bg-[#2b191b] text-[#f08a8e]",
};

export function StatusBadge({ status }: { status: Appointment["status"] }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${styles[status]}`}>{status.charAt(0) + status.slice(1).toLowerCase()}</span>;
}

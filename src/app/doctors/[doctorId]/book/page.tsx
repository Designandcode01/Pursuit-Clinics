import Link from "next/link";
import { notFound } from "next/navigation";
import { BookingForm } from "@/components/appointments/booking-form";
import { DemoBookingPreview } from "@/components/appointments/demo-booking-preview";
import { getActiveDoctor } from "@/features/doctors/queries";
import { addCalendarDay, localDateAt } from "@/features/availability/timezone";
import { formatConsultationFee } from "@/lib/format";

export default async function BookDoctorPage({ params }: { params: Promise<{ doctorId: string }> }) {
  const { doctorId } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(doctorId)) notFound();
  const doctor = await getActiveDoctor(doctorId);
  if (!doctor) notFound();

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-10 lg:px-10">
      <Link href={`/doctors/${doctor.id}`} className="text-sm text-[var(--muted)] hover:text-white">← Back to profile</Link>
      <div className="mt-8"><p className="text-sm text-[var(--primary)]">Book an appointment</p><h1 className="mt-2 text-3xl font-medium tracking-tight">{doctor.displayName}</h1><p className="mt-2 text-sm text-[var(--muted)]">{doctor.specialtyName} · {formatConsultationFee(doctor.consultationFee)} · {doctor.appointmentDurationMinutes} minutes</p></div>
      {doctor.isDemo
        ? <DemoBookingPreview doctorName={doctor.displayName} timezone={doctor.timezone} firstDate={addCalendarDay(localDateAt(new Date(), doctor.timezone))} />
        : <div className="mt-7"><BookingForm doctorId={doctor.id} timezone={doctor.timezone} minDate={localDateAt(new Date(), doctor.timezone)} /></div>}
    </main>
  );
}

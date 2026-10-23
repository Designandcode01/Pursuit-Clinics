import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getActiveDoctor } from "@/features/doctors/queries";
import { formatConsultationFee, initials } from "@/lib/format";

export default async function DoctorProfilePage({ params }: { params: Promise<{ doctorId: string }> }) {
  const { doctorId } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(doctorId)) notFound();
  const doctor = await getActiveDoctor(doctorId);
  if (!doctor) notFound();

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-10 lg:px-10">
      <Link href="/doctors" className="text-sm text-[var(--muted)] hover:text-white">← All doctors</Link>
      <article className="mt-8 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          {doctor.imageUrl ? <Image src={doctor.imageUrl} alt="" width={96} height={96} unoptimized className="size-24 rounded-3xl object-cover" /> : <div className="grid size-24 place-items-center rounded-3xl bg-[#193a34] text-2xl font-medium text-[var(--primary)]">{initials(doctor.displayName)}</div>}
          <div><p className="text-sm text-[var(--primary)]">{doctor.specialtyName}</p><h1 className="mt-1 text-3xl font-medium tracking-tight">{doctor.displayName}</h1><p className="mt-2 text-sm text-[var(--muted)]">{doctor.isDemo ? "Fictional demo profile · not a real provider" : doctor.qualifications || "Medical practitioner"}</p></div>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-3"><div className="rounded-2xl border border-[var(--border)] bg-[#0b1216] p-4"><p className="text-xs text-[var(--muted)]">Consultation</p><p className="mt-2 font-medium">{formatConsultationFee(doctor.consultationFee)}</p></div><div className="rounded-2xl border border-[var(--border)] bg-[#0b1216] p-4"><p className="text-xs text-[var(--muted)]">Appointment length</p><p className="mt-2 font-medium">{doctor.appointmentDurationMinutes} minutes</p></div><div className="rounded-2xl border border-[var(--border)] bg-[#0b1216] p-4"><p className="text-xs text-[var(--muted)]">Doctor&apos;s timezone</p><p className="mt-2 font-medium">{doctor.timezone}</p></div></div>
        {doctor.websiteUrl && <p className="mt-6"><a href={doctor.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--primary)] hover:underline">Visit doctor&apos;s website ↗</a></p>}
        <section className="mt-8"><h2 className="text-lg font-medium">About</h2><p className="mt-3 whitespace-pre-line leading-7 text-[var(--muted)]">{doctor.biography || "This provider has not added a biography yet."}</p></section>
        <section id="appointments" className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-[#0b1216] p-5"><div><h2 className="font-medium">{doctor.isDemo ? "Demo profile" : "Appointment availability"}</h2><p className="mt-2 text-sm text-[var(--muted)]">{doctor.isDemo ? "Try the sample booking preview. It won’t create a real appointment." : "Choose a date to see times in the doctor’s local timezone."}</p></div><Link href={`/doctors/${doctor.id}/book`} className={`rounded-xl px-5 py-3 text-sm font-semibold transition ${doctor.isDemo ? "border border-[var(--border)] text-[var(--primary)] hover:border-[var(--primary)]" : "bg-[var(--primary)] text-[#071411] hover:bg-[var(--primary-strong)]"}`}>{doctor.isDemo ? "Preview demo booking" : "Book appointment"}</Link></section>
      </article>
    </main>
  );
}

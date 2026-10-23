import Link from "next/link";
import Image from "next/image";
import type { getActiveDoctors } from "@/features/doctors/queries";
import { formatConsultationFee, initials } from "@/lib/format";

type Doctor = Awaited<ReturnType<typeof getActiveDoctors>>["doctors"][number];

export function DoctorCard({ doctor }: { doctor: Doctor }) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 transition hover:-translate-y-0.5 hover:border-[#3c7569]">
      <div className="flex items-start gap-4">
        {doctor.imageUrl ? <Image src={doctor.imageUrl} alt="" width={56} height={56} unoptimized className="size-14 rounded-2xl object-cover" /> : <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-[#193a34] font-medium text-[var(--primary)]">{initials(doctor.displayName)}</div>}
        <div className="min-w-0"><p className="text-xs text-[var(--primary)]">{doctor.specialtyName}</p><h2 className="mt-1 truncate font-medium">{doctor.displayName}</h2><p className="mt-1 text-xs text-[var(--muted)]">{doctor.isDemo ? "Fictional demo profile" : doctor.qualifications || "Medical practitioner"}</p></div>
      </div>
      <p className="mt-5 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-[var(--muted)]">{doctor.biography || "Profile information will be added soon."}</p>
      <div className="mt-5 flex items-center justify-between border-t border-[var(--border)] pt-4 text-sm"><span className="text-[var(--muted)]">{formatConsultationFee(doctor.consultationFee)}</span><span className="text-xs text-[var(--muted)]">{doctor.appointmentDurationMinutes} min</span></div>
      <Link href={`/doctors/${doctor.id}`} className="mt-4 inline-flex justify-center rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-medium transition hover:border-[var(--primary)] hover:text-[var(--primary)]">{doctor.isDemo ? "View demo profile" : "View profile"}</Link>
    </article>
  );
}

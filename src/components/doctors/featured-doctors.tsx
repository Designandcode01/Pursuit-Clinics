import Link from "next/link";
import { getActiveDoctors } from "@/features/doctors/queries";
import { DoctorCard } from "@/components/doctors/doctor-card";

export async function FeaturedDoctors() {
  const { doctors } = await getActiveDoctors({ page: 1 });
  if (!doctors.length) return <p className="mt-8 text-sm text-[var(--muted)]">New provider profiles will be featured here.</p>;

  return <><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{doctors.slice(0, 3).map((doctor) => <DoctorCard key={doctor.id} doctor={doctor} />)}</div><div className="mt-6"><Link href="/doctors" className="text-sm text-[var(--primary)] hover:underline">Browse all doctors ↗</Link></div></>;
}

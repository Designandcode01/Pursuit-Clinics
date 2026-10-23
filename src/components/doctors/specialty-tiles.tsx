import Link from "next/link";
import { getSpecialties } from "@/features/doctors/queries";

export async function SpecialtyTiles() {
  const specialties = await getSpecialties();
  if (!specialties.length) return <p className="mt-8 text-sm text-[var(--muted)]">Specialties will appear here as they are added.</p>;

  return <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">{specialties.slice(0, 8).map((specialty, i) => <Link key={specialty.id} href={`/doctors?specialty=${specialty.slug}`} className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 transition hover:-translate-y-0.5 hover:border-[#3c7569]"><span className="text-2xl text-[var(--secondary)]">{["◉", "♡", "✧", "⌂"][i % 4]}</span><h3 className="mt-5 font-medium">{specialty.name}</h3><p className="mt-1 text-xs text-[var(--muted)]">Explore available care</p></Link>)}</div>;
}

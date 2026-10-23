import Link from "next/link";
import { headers } from "next/headers";
import { DoctorCard } from "@/components/doctors/doctor-card";
import { getActiveDoctors, getSpecialties } from "@/features/doctors/queries";
import { checkPublicRateLimit } from "@/lib/rate-limit";

type SearchParams = Promise<{ q?: string; specialty?: string; page?: string }>;

function queryHref(params: { q?: string; specialty?: string; page: number }) {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.specialty) search.set("specialty", params.specialty);
  search.set("page", String(params.page));
  return `/doctors?${search.toString()}`;
}

export default async function DoctorsPage({ searchParams }: { searchParams: SearchParams }) {
  const limit = await checkPublicRateLimit(await headers(), "doctor-directory", 60);
  if (!limit.allowed) {
    return <main className="mx-auto min-h-screen max-w-7xl px-6 py-10 lg:px-10"><p className="text-sm text-[var(--primary)]">Doctor directory</p><h1 className="mt-2 text-3xl font-medium">Please slow down</h1><p className="mt-3 text-sm text-[var(--muted)]">Too many directory requests. Please try again in about a minute.</p></main>;
  }
  const params = await searchParams;
  const page = Math.max(1, Math.min(1000, Number.parseInt(params.page ?? "1", 10) || 1));
  const search = params.q?.trim().slice(0, 100) ?? "";
  const [specialtyList, result] = await Promise.all([
    getSpecialties(),
    getActiveDoctors({ search, specialty: params.specialty, page }),
  ]);

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-10 lg:px-10">
      <Link href="/" className="text-sm text-[var(--muted)] hover:text-white">← Wellnest</Link>
      <div className="mt-8"><p className="text-sm text-[var(--primary)]">Care, made simpler</p><h1 className="mt-2 text-4xl font-medium tracking-tight">Find your doctor</h1><p className="mt-3 max-w-2xl text-[var(--muted)]">Browse active providers and explore their profiles to find care that fits your needs.</p></div>
      <form action="/doctors" className="mt-8 grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:grid-cols-[1fr_15rem_auto]">
        <label className="flex flex-col gap-2 text-xs text-[var(--muted)]">Doctor or specialty<input name="q" defaultValue={search} placeholder="Search by name or specialty" className="rounded-xl border border-[var(--border)] bg-[#0b1216] px-3 py-2.5 text-sm text-white outline-none focus:border-[var(--primary)]" /></label>
        <label className="flex flex-col gap-2 text-xs text-[var(--muted)]">Specialty<select name="specialty" defaultValue={params.specialty ?? ""} className="rounded-xl border border-[var(--border)] bg-[#0b1216] px-3 py-2.5 text-sm text-white outline-none focus:border-[var(--primary)]"><option value="">All specialties</option>{specialtyList.map((specialty) => <option key={specialty.id} value={specialty.slug}>{specialty.name}</option>)}</select></label>
        <button className="self-end rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-[#071411] transition hover:bg-[var(--primary-strong)]">Search doctors</button>
      </form>
      {result.doctors.length ? <>{result.doctors.some((doctor) => doctor.isDemo) && <p className="mt-6 rounded-xl border border-[#8b7547]/40 bg-[#211d14] px-4 py-3 text-sm text-[#dfc98f]">Demo listings are fictional examples for preview. Booking is disabled for these profiles.</p>}<div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{result.doctors.map((doctor) => <DoctorCard key={doctor.id} doctor={doctor} />)}</div>
        <nav className="mt-8 flex justify-between" aria-label="Doctor directory pages">{page > 1 ? <Link className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm hover:border-[var(--primary)]" href={queryHref({ q: search, specialty: params.specialty, page: page - 1 })}>← Previous</Link> : <span />}{result.hasNextPage && <Link className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm hover:border-[var(--primary)]" href={queryHref({ q: search, specialty: params.specialty, page: page + 1 })}>Next →</Link>}</nav>
      </> : <section className="mt-8 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-14 text-center"><p className="text-lg font-medium">No doctors found</p><p className="mt-2 text-sm text-[var(--muted)]">Try another name or specialty, or clear your filters.</p><Link href="/doctors" className="mt-5 inline-flex rounded-xl border border-[var(--border)] px-4 py-2 text-sm hover:border-[var(--primary)]">Clear search</Link></section>}
    </main>
  );
}

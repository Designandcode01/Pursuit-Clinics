import { Suspense } from "react";
import { SpecialtyForm } from "@/components/admin/specialty-form";
import { AdminNav } from "@/components/layout/admin-nav";
import { getStoredSpecialties } from "@/features/doctors/queries";
import { requireRole } from "@/lib/auth/user";

async function SpecialtiesContent() {
  await requireRole("ADMIN");
  const specialties = await getStoredSpecialties();
  return <><AdminNav /><main className="mx-auto min-h-screen max-w-5xl px-6 py-8 lg:px-10"><p className="text-sm text-[var(--primary)]">Directory configuration</p><h1 className="mt-2 text-3xl font-medium tracking-tight">Specialties</h1><p className="mt-2 mb-6 text-sm text-[var(--muted)]">Manage the specialties used in the public doctor directory.</p><SpecialtyForm /><div className="mt-6 grid gap-3">{specialties.map((specialty) => <SpecialtyForm key={specialty.id} item={specialty} />)}</div></main></>;
}
export default function AdminSpecialtiesPage() { return <Suspense fallback={<main className="min-h-screen animate-pulse bg-[var(--background)]" />}><SpecialtiesContent /></Suspense>; }

import { Suspense } from "react";
import { DoctorNav } from "@/components/layout/doctor-nav";
import { DoctorProfileForm } from "@/components/doctor/profile-form";
import { requireDoctorProfile } from "@/lib/auth/doctor";

async function DoctorProfileContent() {
  const { profile } = await requireDoctorProfile();
  return <><DoctorNav /><main className="mx-auto min-h-screen max-w-4xl px-6 py-8 lg:px-10"><p className="text-sm text-[var(--primary)]">Professional details</p><h1 className="mt-2 text-3xl font-medium tracking-tight">Your profile</h1><p className="mt-2 mb-7 text-sm text-[var(--muted)]">Update how your public provider profile appears and configure visit length and buffer time.</p><DoctorProfileForm profile={profile} /></main></>;
}

export default function DoctorProfilePage() {
  return <Suspense fallback={<main className="min-h-screen animate-pulse bg-[var(--background)]" />}><DoctorProfileContent /></Suspense>;
}

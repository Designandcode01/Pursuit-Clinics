import { Suspense } from "react";
import { UserProfile } from "@clerk/nextjs";
import { PatientNav } from "@/components/layout/patient-nav";
import { requireRole } from "@/lib/auth/user";

async function ProfileContent() {
  await requireRole("PATIENT");
  return <><PatientNav /><main className="mx-auto min-h-screen max-w-5xl px-6 py-8 lg:px-10"><p className="text-sm text-[var(--primary)]">Your account</p><h1 className="mt-2 text-3xl font-medium tracking-tight">Profile and security</h1><p className="mt-2 mb-7 text-sm text-[var(--muted)]">Manage your sign-in details and personal information.</p><UserProfile /></main></>;
}

export default function PatientProfilePage() {
  return <Suspense fallback={<main className="min-h-screen animate-pulse bg-[var(--background)]" />}><ProfileContent /></Suspense>;
}

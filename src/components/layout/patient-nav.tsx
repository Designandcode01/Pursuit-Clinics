import Link from "next/link";
import { AuthActions } from "@/components/layout/auth-actions";

export function PatientNav() {
  return <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5 lg:px-10"><Link href="/patient/dashboard" className="font-semibold">well<span className="text-[var(--primary)]">nest</span></Link><nav className="hidden gap-6 text-sm text-[var(--muted)] sm:flex"><Link href="/patient/dashboard" className="hover:text-white">Overview</Link><Link href="/patient/appointments" className="hover:text-white">Appointments</Link><Link href="/patient/profile" className="hover:text-white">Profile</Link><Link href="/doctors" className="hover:text-white">Find a doctor</Link></nav><AuthActions /></header>;
}

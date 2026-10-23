import Link from "next/link";
import { AuthActions } from "@/components/layout/auth-actions";

export function AdminNav() {
  return <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5 lg:px-10"><Link href="/admin/dashboard" className="font-semibold">well<span className="text-[var(--primary)]">nest</span><span className="ml-2 rounded-full border border-[var(--border)] px-2 py-1 text-[10px] text-[var(--muted)]">ADMIN</span></Link><nav className="hidden gap-5 text-sm text-[var(--muted)] lg:flex"><Link href="/admin/dashboard" className="hover:text-white">Overview</Link><Link href="/admin/doctors" className="hover:text-white">Doctors</Link><Link href="/admin/patients" className="hover:text-white">Patients</Link><Link href="/admin/appointments" className="hover:text-white">Appointments</Link><Link href="/admin/specialties" className="hover:text-white">Specialties</Link></nav><AuthActions /></header>;
}

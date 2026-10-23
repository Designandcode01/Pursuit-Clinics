import Link from "next/link";
import { Suspense } from "react";
import { AuthActions } from "@/components/layout/auth-actions";
import { FeaturedDoctors } from "@/components/doctors/featured-doctors";
import { SpecialtyTiles } from "@/components/doctors/specialty-tiles";
const steps = [
  ["01", "Find your doctor", "Explore specialties and profiles to find a provider who fits your needs."],
  ["02", "Choose a time", "See available appointment times and choose what works for you."],
  ["03", "Feel prepared", "Keep your appointment details together and focus on your visit."],
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
        <Link href="/" className="flex items-center gap-3 font-semibold tracking-tight"><span className="grid size-10 place-items-center rounded-xl bg-[var(--primary)] text-lg text-[#071411]">+</span><span>well<span className="text-[var(--primary)]">nest</span></span></Link>
        <nav className="hidden items-center gap-8 text-sm text-[var(--muted)] md:flex"><Link className="transition hover:text-white" href="/doctors">Find a doctor</Link><a className="transition hover:text-white" href="#how-it-works">How it works</a></nav>
        <AuthActions />
      </header>
      <section className="mx-auto grid max-w-7xl gap-14 px-6 pb-24 pt-16 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:px-10 lg:pb-32 lg:pt-20">
        <div>
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-xs text-[var(--muted)]"><span className="size-2 rounded-full bg-[var(--primary)]" /> Care that fits your life</div>
          <h1 className="max-w-2xl text-5xl leading-[1.08] font-medium tracking-[-.055em] sm:text-6xl lg:text-7xl">Your health, in <span className="text-[var(--primary)]">good hands.</span></h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[var(--muted)]">Find a doctor you trust and book a time that works for you. Thoughtful care starts with a simpler appointment.</p>
          <form action="/doctors" className="mt-9 flex max-w-xl flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 sm:flex-row"><label className="flex flex-1 items-center gap-3 px-3"><span aria-hidden="true" className="text-lg text-[var(--primary)]">⌕</span><input name="q" placeholder="Doctor name or specialty" className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-[#75858a]" /></label><button className="rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-[#071411] transition hover:bg-[var(--primary-strong)]">Find a doctor</button></form>
          <p className="mt-4 text-xs text-[#75858a]">Browse provider profiles and appointment times in one place.</p>
        </div>
        <div className="relative mx-auto w-full max-w-lg"><div className="absolute -inset-8 rounded-full bg-[#14372f]/20 blur-3xl" /><div className="relative rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-2xl shadow-black/30 sm:p-7">
          <div className="flex items-start justify-between"><div><p className="text-xs tracking-wide text-[var(--muted)] uppercase">Your care, at a glance</p><h2 className="mt-2 text-xl font-medium">A calmer way to get care</h2></div><span className="grid size-11 place-items-center rounded-2xl bg-[#193a34] text-xl text-[var(--primary)]">✳</span></div>
          <div className="mt-8 rounded-2xl border border-[var(--border)] bg-[#0d1418] p-5"><div className="flex items-center gap-4"><div className="grid size-14 place-items-center rounded-full bg-[#284a50] text-lg text-[#b8d8d5]">DR</div><div><p className="font-medium">Care begins with a conversation</p><p className="mt-1 text-sm text-[var(--muted)]">Choose a specialist and a time</p></div></div>
            <div className="mt-6 grid grid-cols-7 gap-2 text-center text-xs text-[var(--muted)]">{["M", "T", "W", "T", "F", "S", "S"].map((day, i) => <div key={`${day}-${i}`} className="py-2"><span>{day}</span><span className={`mt-2 grid size-9 place-items-center rounded-xl ${i === 2 ? "bg-[var(--primary)] font-semibold text-[#071411]" : "bg-[var(--surface-raised)] text-white"}`}>{12 + i}</span></div>)}</div>
            <div className="mt-4 flex items-center justify-between rounded-xl bg-[#15312b] px-4 py-3"><span className="text-sm text-[#b8d8d5]">Available appointments</span><span className="text-xs font-medium text-[var(--primary)]">View times ↗</span></div></div>
          <div className="mt-5 flex gap-3 text-xs text-[var(--muted)]"><span className="rounded-full border border-[var(--border)] px-3 py-2">Secure booking</span><span className="rounded-full border border-[var(--border)] px-3 py-2">Your schedule</span></div>
        </div></div>
      </section>
      <section className="border-y border-[var(--border)] bg-[#0c1216]"><div className="mx-auto max-w-7xl px-6 py-14 lg:px-10"><div className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-sm text-[var(--primary)]">Explore care</p><h2 className="mt-2 text-2xl font-medium tracking-tight">Find the right specialty</h2></div><Link href="/doctors" className="text-sm text-[var(--muted)] transition hover:text-[var(--primary)]">See all doctors ↗</Link></div>
        <Suspense fallback={<div className="mt-8 h-36 animate-pulse rounded-2xl bg-[var(--surface)]" />}><SpecialtyTiles /></Suspense>
      </div></section>
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-10"><p className="text-sm text-[var(--primary)]">Meet our providers</p><div className="flex flex-wrap items-end justify-between gap-4"><h2 className="mt-2 text-3xl font-medium tracking-tight">Care from people who listen</h2><Link href="/doctors" className="text-sm text-[var(--muted)] hover:text-[var(--primary)]">Explore the directory ↗</Link></div><Suspense fallback={<div className="mt-8 h-72 animate-pulse rounded-2xl bg-[var(--surface)]" />}><FeaturedDoctors /></Suspense></section>
      <section id="how-it-works" className="mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-24"><p className="text-sm text-[var(--primary)]">Simple by design</p><h2 className="mt-2 text-3xl font-medium tracking-tight">Care in three easy steps</h2><div className="mt-10 grid gap-4 md:grid-cols-3">{steps.map(([n, title, body]) => <article key={n} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6"><span className="text-sm text-[var(--primary)]">{n}</span><h3 className="mt-8 text-lg font-medium">{title}</h3><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{body}</p></article>)}</div></section>
      <footer className="border-t border-[var(--border)] px-6 py-7 text-sm text-[var(--muted)]"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 lg:px-10"><span>© 2026 Wellnest. Care, made simpler.</span><div className="flex gap-5"><Link href="/doctors" className="hover:text-white">Find a doctor</Link><Link href="/sign-in" className="hover:text-white">Sign in</Link></div></div></footer>
    </main>
  );
}

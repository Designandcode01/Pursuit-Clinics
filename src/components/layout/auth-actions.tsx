import { Suspense } from "react";
import Link from "next/link";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

export function AuthActions() {
  return (
    <Suspense fallback={<div className="h-10 w-36" aria-hidden="true" />}>
      <Show when="signed-out">
        <div className="flex items-center gap-3">
          <SignInButton mode="redirect" forceRedirectUrl="/onboarding">
            <Link href="/sign-in" className="rounded-xl px-4 py-2.5 text-sm text-[var(--muted)] transition hover:text-white">Sign in</Link>
          </SignInButton>
          <SignUpButton mode="redirect" forceRedirectUrl="/onboarding">
            <Link href="/sign-up" className="rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-[#071411] transition hover:bg-[var(--primary-strong)]">Get started</Link>
          </SignUpButton>
        </div>
      </Show>
      <Show when="signed-in"><UserButton /></Show>
    </Suspense>
  );
}

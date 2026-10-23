import { Suspense } from "react";
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="grid min-h-[calc(100vh-5rem)] place-items-center px-5 py-12">
      <Suspense fallback={<div className="h-[28rem] w-full max-w-md animate-pulse rounded-3xl border border-[var(--border)] bg-[var(--surface)]" />}>
        <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" fallbackRedirectUrl="/onboarding" />
      </Suspense>
    </main>
  );
}

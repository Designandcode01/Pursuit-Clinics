import { Suspense } from "react";
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="grid min-h-[calc(100vh-5rem)] place-items-center px-5 py-12">
      <Suspense fallback={<div className="h-[28rem] w-full max-w-md animate-pulse rounded-3xl border border-[var(--border)] bg-[var(--surface)]" />}>
        <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" fallbackRedirectUrl="/onboarding" />
      </Suspense>
    </main>
  );
}

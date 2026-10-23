import { clerkMiddleware } from "@clerk/nextjs/server";

const protectedPath = /^\/(patient|doctor|admin|onboarding)(\/|$)/;

export default clerkMiddleware(async (auth, request) => {
  if (protectedPath.test(request.nextUrl.pathname)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};

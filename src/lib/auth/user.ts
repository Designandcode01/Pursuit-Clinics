import "server-only";
import { currentUser } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { db } from "@/db";
import { users, type User } from "@/db/schema";

/** Synchronizes the trusted Clerk identity on first access and on subsequent profile changes. */
export async function getOrCreateAppUser(): Promise<User | null> {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email = clerkUser.emailAddresses.find(
    (address) => address.id === clerkUser.primaryEmailAddressId,
  )?.emailAddress;
  if (!email) {
    throw new Error("Your Clerk account needs a primary email address to continue.");
  }

  const name =
    clerkUser.fullName ??
    ([clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || clerkUser.username || "Patient");

  const [appUser] = await db
    .insert(users)
    .values({
      clerkUserId: clerkUser.id,
      name,
      email,
      imageUrl: clerkUser.imageUrl,
    })
    .onConflictDoUpdate({
      target: users.clerkUserId,
      set: { name, email, imageUrl: clerkUser.imageUrl, updatedAt: new Date() },
    })
    .returning();

  return appUser ?? null;
}

export async function requireAppUser(): Promise<User> {
  const user = await getOrCreateAppUser();
  if (!user) redirect("/sign-in");
  return user;
}

export async function requireRole(role: User["role"]): Promise<User> {
  const user = await requireAppUser();
  if (user.role !== role) notFound();
  return user;
}

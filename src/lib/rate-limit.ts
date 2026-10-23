import "server-only";

import { createHmac } from "node:crypto";
import { lt, sql } from "drizzle-orm";
import { connection } from "next/server";
import { db } from "@/db";
import { publicRateLimits } from "@/db/schema";

type PublicLimit = { allowed: boolean; remaining: number; retryAfterSeconds: number };

/** Shared fixed-window limiter backed by Neon, so counts are consistent across app instances. */
export async function checkPublicRateLimit(
  requestHeaders: Pick<globalThis.Headers, "get">,
  scope: "doctor-directory" | "doctor-availability",
  limit: number,
  windowMs = 60_000,
): Promise<PublicLimit> {
  await connection();
  const forwarded = requestHeaders.get("x-forwarded-for") ?? requestHeaders.get("x-real-ip") ?? "unknown";
  const clientAddress = forwarded.split(",").map((value) => value.trim()).filter(Boolean).at(-1) ?? "unknown";
  const secret = process.env.DATABASE_URL;
  if (!secret) throw new Error("DATABASE_URL is required for public rate limiting.");

  const now = Date.now();
  const windowStart = new Date(Math.floor(now / windowMs) * windowMs);
  const key = createHmac("sha256", secret).update(`${scope}:${clientAddress}`).digest("hex");
  const [bucket] = await db.insert(publicRateLimits).values({ key, windowStartedAt: windowStart, requestCount: 1 })
    .onConflictDoUpdate({
      target: publicRateLimits.key,
      set: {
        requestCount: sql`case when ${publicRateLimits.windowStartedAt} < ${windowStart} then 1 else ${publicRateLimits.requestCount} + 1 end`,
        windowStartedAt: sql`case when ${publicRateLimits.windowStartedAt} < ${windowStart} then ${windowStart} else ${publicRateLimits.windowStartedAt} end`,
        updatedAt: new Date(now),
      },
    })
    .returning({ requestCount: publicRateLimits.requestCount });

  // Opportunistically remove inactive keys so the shared bucket table stays bounded over time.
  if (Math.random() < 0.001) {
    await db.delete(publicRateLimits).where(lt(publicRateLimits.updatedAt, new Date(now - 7 * 24 * 60 * 60 * 1000)));
  }

  return {
    allowed: bucket.requestCount <= limit,
    remaining: Math.max(0, limit - bucket.requestCount),
    retryAfterSeconds: Math.max(1, Math.ceil((windowStart.getTime() + windowMs - now) / 1000)),
  };
}

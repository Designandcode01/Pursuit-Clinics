import { NextResponse } from "next/server";
import { z } from "zod";
import { getAvailableSlots } from "@/features/availability/service";
import { checkPublicRateLimit } from "@/lib/rate-limit";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const doctorIdSchema = z.string().uuid();

export async function GET(request: Request, { params }: { params: Promise<{ doctorId: string }> }) {
  try {
    const limit = await checkPublicRateLimit(request.headers, "doctor-availability", 120);
    if (!limit.allowed) {
      return NextResponse.json({ error: "Too many availability requests. Try again shortly." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } });
    }

    const { doctorId } = await params;
    const url = new URL(request.url);
    const doctorResult = doctorIdSchema.safeParse(doctorId);
    const dateResult = dateSchema.safeParse(url.searchParams.get("date"));
    if (!doctorResult.success || !dateResult.success) {
      return NextResponse.json({ error: "A valid doctor and local date are required." }, { status: 400 });
    }

    const slots = await getAvailableSlots(doctorId, dateResult.data);
    return NextResponse.json({ slots });
  } catch {
    return NextResponse.json({ error: "Availability is temporarily unavailable." }, { status: 503 });
  }
}

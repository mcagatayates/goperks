import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyApiKey } from "@/lib/pos";
import { upsertExternalReservation, ReservationError } from "@/lib/reservations";

// The inbound half of the POS integration: a restaurant's *other*
// reservation system (Adisyo, Logo, a spreadsheet-driven bridge via
// Zapier/Make, whatever it is) calls this whenever it takes or changes a
// booking, so HeyTable's own availability engine blocks that table too and
// never double-books it. Authenticated with the same restaurant-scoped API
// key as the pull endpoint (GET .../pos/reservations) — one key, both
// directions.
const ExternalBookingSchema = z.object({
  externalId: z.string().trim().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  partySize: z.number().int().min(1),
  tableName: z.string().trim().min(1).optional(),
  customerName: z.string().trim().optional(),
  customerPhone: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/restaurants/[slug]/pos/external-bookings">
) {
  const { slug } = await ctx.params;
  const restaurant = await verifyApiKey(slug, request.headers.get("authorization"));
  if (!restaurant) {
    return NextResponse.json(
      { error: "Geçersiz veya eksik API anahtarı." },
      { status: 401 }
    );
  }

  const body = await request.json();
  const parsed = ExternalBookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Formu kontrol edin: " + parsed.error.issues[0]?.message },
      { status: 400 }
    );
  }

  try {
    const reservation = await upsertExternalReservation({
      restaurantId: restaurant.id,
      ...parsed.data,
    });
    return NextResponse.json({ reservation }, { status: 201 });
  } catch (err) {
    if (err instanceof ReservationError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }
}

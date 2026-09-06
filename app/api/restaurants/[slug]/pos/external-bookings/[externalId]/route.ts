import { NextResponse } from "next/server";
import { verifyApiKey } from "@/lib/pos";
import { cancelExternalReservation, ReservationError } from "@/lib/reservations";

// Releases the table when the restaurant's other system cancels/deletes
// the booking — otherwise a stale external block would keep it
// unavailable in HeyTable forever.
export async function DELETE(
  request: Request,
  ctx: RouteContext<"/api/restaurants/[slug]/pos/external-bookings/[externalId]">
) {
  const { slug, externalId } = await ctx.params;
  const restaurant = await verifyApiKey(slug, request.headers.get("authorization"));
  if (!restaurant) {
    return NextResponse.json(
      { error: "Geçersiz veya eksik API anahtarı." },
      { status: 401 }
    );
  }

  try {
    const reservation = await cancelExternalReservation(restaurant.id, externalId);
    return NextResponse.json({ reservation });
  } catch (err) {
    if (err instanceof ReservationError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    throw err;
  }
}

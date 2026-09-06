import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RESERVATION_STATUSES } from "@/lib/types";
import { assertRestaurantAccess } from "@/lib/auth";
import { notifyReservationCancelled } from "@/lib/notifications/reservation-notifications";
import { notifyPosWebhook } from "@/lib/pos";

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/restaurants/[slug]/reservations/[id]">
) {
  const { slug, id } = await ctx.params;
  const access = await assertRestaurantAccess(slug);
  if (access instanceof NextResponse) return access;

  const body = await request.json();
  const { status } = body as { status?: string };

  if (!status || !RESERVATION_STATUSES.includes(status as never)) {
    return NextResponse.json(
      { error: `Durum şunlardan biri olmalı: ${RESERVATION_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  const reservation = await prisma.reservation.update({
    where: { id },
    data: { status },
    include: { table: true, restaurant: true },
  });

  if (status === "cancelled") {
    try {
      await notifyReservationCancelled({
        restaurantName: reservation.restaurant.name,
        customerName: reservation.customerName,
        customerPhone: reservation.customerPhone,
        customerEmail: reservation.customerEmail,
        startsAt: reservation.startsAt,
      });
    } catch (err) {
      console.error("Reservation cancellation notification failed", err);
    }
  }

  try {
    await notifyPosWebhook(
      reservation.restaurant,
      status === "cancelled" ? "reservation.cancelled" : "reservation.updated",
      reservation
    );
  } catch (err) {
    console.error("POS webhook failed", err);
  }

  return NextResponse.json({ reservation });
}

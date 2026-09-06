import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createReservation, ReservationError } from "@/lib/reservations";

export async function GET(
  request: Request,
  ctx: RouteContext<"/api/restaurants/[slug]/reservations">
) {
  const { slug } = await ctx.params;
  const restaurant = await prisma.restaurant.findUnique({ where: { slug } });
  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  const reservations = await prisma.reservation.findMany({
    where: {
      restaurantId: restaurant.id,
      ...(date
        ? {
            startsAt: {
              gte: new Date(`${date}T00:00:00.000Z`),
              lt: new Date(`${date}T23:59:59.999Z`),
            },
          }
        : {}),
    },
    include: { table: true },
    orderBy: { startsAt: "asc" },
  });

  return NextResponse.json({ reservations });
}

// Manual reservation entry from the dashboard — walk-ins and phone calls
// taken directly by staff, outside the AI conversation flow.
export async function POST(
  request: Request,
  ctx: RouteContext<"/api/restaurants/[slug]/reservations">
) {
  const { slug } = await ctx.params;
  const restaurant = await prisma.restaurant.findUnique({ where: { slug } });
  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  const body = await request.json();
  const { date, time, partySize, customerName, customerPhone, notes } =
    body as {
      date?: string;
      time?: string;
      partySize?: number;
      customerName?: string;
      customerPhone?: string;
      notes?: string;
    };

  if (
    !date ||
    !time ||
    partySize === undefined ||
    !customerName ||
    !customerPhone
  ) {
    return NextResponse.json(
      {
        error:
          "date, time, partySize, customerName and customerPhone are required",
      },
      { status: 400 }
    );
  }

  try {
    const { reservation } = await createReservation({
      restaurantId: restaurant.id,
      date,
      time,
      partySize,
      customerName,
      customerPhone,
      notes,
      channel: "staff",
    });
    return NextResponse.json({ reservation }, { status: 201 });
  } catch (err) {
    if (err instanceof ReservationError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createReservation, ReservationError } from "@/lib/reservations";
import { assertRestaurantAccess } from "@/lib/auth";

export async function GET(
  request: Request,
  ctx: RouteContext<"/api/restaurants/[slug]/reservations">
) {
  const { slug } = await ctx.params;
  const access = await assertRestaurantAccess(slug);
  if (access instanceof NextResponse) return access;
  const restaurant = access;

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const scope = searchParams.get("scope");
  const q = searchParams.get("q")?.trim();

  // scope=history: the dashboard's "Geçmiş" tab — every past reservation
  // (any date, any status), newest first, optionally filtered by guest
  // name/phone — as opposed to the default single-day operational view.
  if (scope === "history") {
    const todayStart = new Date(
      `${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`
    );
    const reservations = await prisma.reservation.findMany({
      where: {
        restaurantId: restaurant.id,
        startsAt: { lt: todayStart },
        ...(q
          ? {
              OR: [
                { customerName: { contains: q } },
                { customerPhone: { contains: q } },
              ],
            }
          : {}),
      },
      include: { table: true },
      orderBy: { startsAt: "desc" },
      take: 200,
    });
    return NextResponse.json({ reservations });
  }

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
  const access = await assertRestaurantAccess(slug);
  if (access instanceof NextResponse) return access;
  const restaurant = access;

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
          "date, time, partySize, customerName ve customerPhone alanları gereklidir.",
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

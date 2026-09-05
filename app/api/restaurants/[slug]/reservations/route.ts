import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

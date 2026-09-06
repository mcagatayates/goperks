import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyApiKey } from "@/lib/pos";

// The pull side of the POS integration: a restaurant's POS (or a
// Zapier/Make bridge) polls this with `Authorization: Bearer <apiKey>` —
// generated from the dashboard's Settings tab — instead of the owner's
// login session, since the caller here is a machine.
export async function GET(
  request: Request,
  ctx: RouteContext<"/api/restaurants/[slug]/pos/reservations">
) {
  const { slug } = await ctx.params;
  const restaurant = await verifyApiKey(slug, request.headers.get("authorization"));
  if (!restaurant) {
    return NextResponse.json(
      { error: "Geçersiz veya eksik API anahtarı." },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const reservations = await prisma.reservation.findMany({
    where: {
      restaurantId: restaurant.id,
      ...(from || to
        ? {
            startsAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    },
    include: { table: true },
    orderBy: { startsAt: "asc" },
  });

  return NextResponse.json({ reservations });
}

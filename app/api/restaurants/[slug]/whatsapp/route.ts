import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isMetaConfigured } from "@/lib/whatsapp-onboarding";
import { assertRestaurantAccess } from "@/lib/auth";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/restaurants/[slug]/whatsapp">
) {
  const { slug } = await ctx.params;
  const access = await assertRestaurantAccess(slug);
  if (access instanceof NextResponse) return access;

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    include: { whatsappConnection: true },
  });
  const connection = restaurant?.whatsappConnection;
  return NextResponse.json({
    metaConfigured: isMetaConfigured(),
    connection: connection
      ? {
          status: connection.status,
          displayPhoneNumber: connection.displayPhoneNumber,
          connectedAt: connection.connectedAt,
        }
      : null,
  });
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/restaurants/[slug]/whatsapp">
) {
  const { slug } = await ctx.params;
  const access = await assertRestaurantAccess(slug);
  if (access instanceof NextResponse) return access;
  const restaurant = access;

  await prisma.whatsAppConnection.updateMany({
    where: { restaurantId: restaurant.id },
    data: { status: "disconnected" },
  });

  return NextResponse.json({ success: true });
}

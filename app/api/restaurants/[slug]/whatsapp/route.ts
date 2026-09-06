import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isMetaConfigured } from "@/lib/whatsapp-onboarding";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/restaurants/[slug]/whatsapp">
) {
  const { slug } = await ctx.params;
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    include: { whatsappConnection: true },
  });
  if (!restaurant) {
    return NextResponse.json({ error: "Restoran bulunamadı." }, { status: 404 });
  }

  const connection = restaurant.whatsappConnection;
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
  const restaurant = await prisma.restaurant.findUnique({ where: { slug } });
  if (!restaurant) {
    return NextResponse.json({ error: "Restoran bulunamadı." }, { status: 404 });
  }

  await prisma.whatsAppConnection.updateMany({
    where: { restaurantId: restaurant.id },
    data: { status: "disconnected" },
  });

  return NextResponse.json({ success: true });
}

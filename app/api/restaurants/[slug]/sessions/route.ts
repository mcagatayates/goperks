import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertRestaurantAccess } from "@/lib/auth";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/restaurants/[slug]/sessions">
) {
  const { slug } = await ctx.params;
  const access = await assertRestaurantAccess(slug);
  if (access instanceof NextResponse) return access;
  const restaurant = access;

  const sessions = await prisma.conversationSession.findMany({
    where: { restaurantId: restaurant.id },
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: {
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: { select: { messages: true } },
    },
  });

  return NextResponse.json({ sessions });
}

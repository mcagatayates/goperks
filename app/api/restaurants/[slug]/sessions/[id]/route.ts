import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertRestaurantAccess } from "@/lib/auth";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/restaurants/[slug]/sessions/[id]">
) {
  const { slug, id } = await ctx.params;
  const access = await assertRestaurantAccess(slug);
  if (access instanceof NextResponse) return access;
  const restaurant = access;

  const session = await prisma.conversationSession.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!session || session.restaurantId !== restaurant.id) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 404 });
  }
  return NextResponse.json({ session });
}

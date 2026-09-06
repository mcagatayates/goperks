import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertRestaurantAccess } from "@/lib/auth";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/restaurants/[slug]">
) {
  const { slug } = await ctx.params;
  const access = await assertRestaurantAccess(slug);
  if (access instanceof NextResponse) return access;

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    include: {
      tables: { orderBy: { name: "asc" } },
      menuItems: true,
    },
  });
  return NextResponse.json({ restaurant });
}

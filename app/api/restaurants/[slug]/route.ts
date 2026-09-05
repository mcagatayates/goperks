import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/restaurants/[slug]">
) {
  const { slug } = await ctx.params;
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    include: {
      tables: { orderBy: { name: "asc" } },
      menuItems: true,
    },
  });
  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }
  return NextResponse.json({ restaurant });
}

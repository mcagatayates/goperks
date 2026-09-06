import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/restaurants/[slug]/menu-items">
) {
  const { slug } = await ctx.params;
  const restaurant = await prisma.restaurant.findUnique({ where: { slug } });
  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  const body = await request.json();
  const { name, description, price, category, isSpecial } = body as {
    name?: string;
    description?: string;
    price?: number;
    category?: string;
    isSpecial?: boolean;
  };

  if (!name?.trim() || !category?.trim() || price === undefined || price < 0) {
    return NextResponse.json(
      { error: "name, category and a non-negative price are required" },
      { status: 400 }
    );
  }

  const menuItem = await prisma.menuItem.create({
    data: {
      restaurantId: restaurant.id,
      name: name.trim(),
      description: description?.trim() ?? "",
      price,
      category: category.trim(),
      isSpecial: isSpecial ?? false,
    },
  });

  return NextResponse.json({ menuItem }, { status: 201 });
}

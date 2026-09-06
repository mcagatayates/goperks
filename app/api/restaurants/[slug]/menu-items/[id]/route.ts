import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/restaurants/[slug]/menu-items/[id]">
) {
  const { id } = await ctx.params;
  const body = await request.json();
  const { name, description, price, category, isSpecial, isAvailable } =
    body as {
      name?: string;
      description?: string;
      price?: number;
      category?: string;
      isSpecial?: boolean;
      isAvailable?: boolean;
    };

  if (price !== undefined && price < 0) {
    return NextResponse.json(
      { error: "price must not be negative" },
      { status: 400 }
    );
  }

  const menuItem = await prisma.menuItem.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name: name.trim() } : {}),
      ...(description !== undefined ? { description: description.trim() } : {}),
      ...(price !== undefined ? { price } : {}),
      ...(category !== undefined ? { category: category.trim() } : {}),
      ...(isSpecial !== undefined ? { isSpecial } : {}),
      ...(isAvailable !== undefined ? { isAvailable } : {}),
    },
  });

  return NextResponse.json({ menuItem });
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/restaurants/[slug]/menu-items/[id]">
) {
  const { id } = await ctx.params;
  await prisma.menuItem.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

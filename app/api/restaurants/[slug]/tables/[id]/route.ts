import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/restaurants/[slug]/tables/[id]">
) {
  const { id } = await ctx.params;
  const body = await request.json();
  const { name, capacity, isActive } = body as {
    name?: string;
    capacity?: number;
    isActive?: boolean;
  };

  if (capacity !== undefined && capacity < 1) {
    return NextResponse.json(
      { error: "capacity must be at least 1" },
      { status: 400 }
    );
  }

  const table = await prisma.restaurantTable.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name: name.trim() } : {}),
      ...(capacity !== undefined ? { capacity } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
    },
  });

  return NextResponse.json({ table });
}

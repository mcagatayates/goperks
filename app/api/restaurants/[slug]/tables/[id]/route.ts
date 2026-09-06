import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertRestaurantAccess } from "@/lib/auth";

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/restaurants/[slug]/tables/[id]">
) {
  const { slug, id } = await ctx.params;
  const access = await assertRestaurantAccess(slug);
  if (access instanceof NextResponse) return access;

  const body = await request.json();
  const { name, capacity, isActive } = body as {
    name?: string;
    capacity?: number;
    isActive?: boolean;
  };

  if (capacity !== undefined && capacity < 1) {
    return NextResponse.json(
      { error: "Kapasite en az 1 olmalıdır." },
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

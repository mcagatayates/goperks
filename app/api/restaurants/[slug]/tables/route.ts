import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/restaurants/[slug]/tables">
) {
  const { slug } = await ctx.params;
  const restaurant = await prisma.restaurant.findUnique({ where: { slug } });
  if (!restaurant) {
    return NextResponse.json({ error: "Restoran bulunamadı." }, { status: 404 });
  }

  const body = await request.json();
  const { name, capacity } = body as { name?: string; capacity?: number };

  if (!name?.trim() || !capacity || capacity < 1) {
    return NextResponse.json(
      { error: "İsim ve en az 1 kapasite gereklidir." },
      { status: 400 }
    );
  }

  const table = await prisma.restaurantTable.create({
    data: { restaurantId: restaurant.id, name: name.trim(), capacity },
  });

  return NextResponse.json({ table }, { status: 201 });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RESERVATION_STATUSES } from "@/lib/types";

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/restaurants/[slug]/reservations/[id]">
) {
  const { id } = await ctx.params;
  const body = await request.json();
  const { status } = body as { status?: string };

  if (!status || !RESERVATION_STATUSES.includes(status as never)) {
    return NextResponse.json(
      { error: `status must be one of: ${RESERVATION_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  const reservation = await prisma.reservation.update({
    where: { id },
    data: { status },
    include: { table: true },
  });

  return NextResponse.json({ reservation });
}

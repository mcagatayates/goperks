import { NextResponse } from "next/server";
import { assertRestaurantAccess } from "@/lib/auth";
import { updateWaitlistStatus } from "@/lib/waitlist";

const VALID_STATUSES = ["waiting", "seated", "cancelled"];

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/restaurants/[slug]/waitlist/[id]">
) {
  const { slug, id } = await ctx.params;
  const access = await assertRestaurantAccess(slug);
  if (access instanceof NextResponse) return access;

  const body = await request.json();
  const { status } = body as { status?: string };
  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `Durum şunlardan biri olmalı: ${VALID_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  const entry = await updateWaitlistStatus(id, status);
  return NextResponse.json({ entry });
}

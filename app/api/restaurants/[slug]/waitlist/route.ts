import { NextResponse } from "next/server";
import { assertRestaurantAccess } from "@/lib/auth";
import { listWaitlist } from "@/lib/waitlist";

export async function GET(
  request: Request,
  ctx: RouteContext<"/api/restaurants/[slug]/waitlist">
) {
  const { slug } = await ctx.params;
  const access = await assertRestaurantAccess(slug);
  if (access instanceof NextResponse) return access;
  const restaurant = access;

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? undefined;

  const entries = await listWaitlist(restaurant.id, date);
  return NextResponse.json({ entries });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertRestaurantAccess } from "@/lib/auth";
import { generateApiKey } from "@/lib/pos";

// (Re)generates the restaurant's POS pull-API key. The previous key stops
// working immediately — same one-way rotation as a regenerated API token
// anywhere else.
export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/restaurants/[slug]/pos/api-key">
) {
  const { slug } = await ctx.params;
  const access = await assertRestaurantAccess(slug);
  if (access instanceof NextResponse) return access;

  const apiKey = generateApiKey();
  await prisma.restaurant.update({
    where: { id: access.id },
    data: { apiKey },
  });

  return NextResponse.json({ apiKey });
}

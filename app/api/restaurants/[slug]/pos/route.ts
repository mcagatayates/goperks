import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertRestaurantAccess } from "@/lib/auth";
import { generateWebhookSecret } from "@/lib/pos";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/restaurants/[slug]/pos">
) {
  const { slug } = await ctx.params;
  const access = await assertRestaurantAccess(slug);
  if (access instanceof NextResponse) return access;

  return NextResponse.json({
    hasApiKey: Boolean(access.apiKey),
    apiKey: access.apiKey,
    posWebhookUrl: access.posWebhookUrl,
    posWebhookSecret: access.posWebhookSecret,
  });
}

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/restaurants/[slug]/pos">
) {
  const { slug } = await ctx.params;
  const access = await assertRestaurantAccess(slug);
  if (access instanceof NextResponse) return access;

  const body = await request.json();
  const { posWebhookUrl } = body as { posWebhookUrl?: string | null };

  if (posWebhookUrl) {
    try {
      new URL(posWebhookUrl);
    } catch {
      return NextResponse.json(
        { error: "Geçerli bir webhook URL'si girin." },
        { status: 400 }
      );
    }
  }

  const restaurant = await prisma.restaurant.update({
    where: { id: access.id },
    data: {
      posWebhookUrl: posWebhookUrl || null,
      posWebhookSecret:
        posWebhookUrl && !access.posWebhookSecret
          ? generateWebhookSecret()
          : posWebhookUrl
            ? access.posWebhookSecret
            : null,
    },
  });

  return NextResponse.json({
    posWebhookUrl: restaurant.posWebhookUrl,
    posWebhookSecret: restaurant.posWebhookSecret,
  });
}

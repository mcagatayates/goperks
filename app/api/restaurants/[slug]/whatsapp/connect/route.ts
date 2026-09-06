import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  exchangeCodeForAccessToken,
  getDisplayPhoneNumber,
  subscribeAppToWaba,
  WhatsAppOnboardingError,
} from "@/lib/whatsapp-onboarding";

// Called by the dashboard's WhatsAppConnect component once Meta's Embedded
// Signup popup has finished — see lib/whatsapp-onboarding.ts for the full
// flow this is step 3-4 of.
export async function POST(
  request: Request,
  ctx: RouteContext<"/api/restaurants/[slug]/whatsapp/connect">
) {
  const { slug } = await ctx.params;
  const restaurant = await prisma.restaurant.findUnique({ where: { slug } });
  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  const body = await request.json();
  const { code, wabaId, phoneNumberId } = body as {
    code?: string;
    wabaId?: string;
    phoneNumberId?: string;
  };

  if (!code || !wabaId || !phoneNumberId) {
    return NextResponse.json(
      { error: "code, wabaId and phoneNumberId are required" },
      { status: 400 }
    );
  }

  try {
    const accessToken = await exchangeCodeForAccessToken(code);
    await subscribeAppToWaba(wabaId, accessToken);
    const displayPhoneNumber = await getDisplayPhoneNumber(
      phoneNumberId,
      accessToken
    );

    const connection = await prisma.whatsAppConnection.upsert({
      where: { restaurantId: restaurant.id },
      create: {
        restaurantId: restaurant.id,
        wabaId,
        phoneNumberId,
        displayPhoneNumber,
        accessToken,
        status: "connected",
        connectedAt: new Date(),
      },
      update: {
        wabaId,
        phoneNumberId,
        displayPhoneNumber,
        accessToken,
        status: "connected",
        connectedAt: new Date(),
      },
    });

    return NextResponse.json({
      connection: {
        status: connection.status,
        displayPhoneNumber: connection.displayPhoneNumber,
        connectedAt: connection.connectedAt,
      },
    });
  } catch (err) {
    if (err instanceof WhatsAppOnboardingError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    throw err;
  }
}

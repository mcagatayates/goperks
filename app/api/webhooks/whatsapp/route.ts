import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runAgentTurn } from "@/lib/agent";
import {
  parseWhatsAppWebhookPayload,
  sendWhatsAppMessage,
} from "@/lib/channels/whatsapp";

// Meta's webhook verification handshake: it calls this once, with a
// challenge token, when you register the webhook URL in the Meta App
// dashboard. Respond with the raw challenge to confirm ownership.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

// Single-tenant stub: every inbound message is routed to this restaurant.
// A production version would resolve the restaurant from the destination
// WhatsApp phone number ID (`entry[0].changes[0].value.metadata.phone_number_id`)
// mapped in a "whatsapp number -> restaurant" table.
const STUB_RESTAURANT_SLUG = process.env.WHATSAPP_RESTAURANT_SLUG ?? "masa19";

export async function POST(request: Request) {
  const payload = await request.json();
  const inbound = parseWhatsAppWebhookPayload(payload);

  // Not a text message (status callback, image, etc.) — acknowledge and skip.
  if (!inbound) {
    return NextResponse.json({ ok: true });
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug: STUB_RESTAURANT_SLUG },
  });
  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  let session = await prisma.conversationSession.findFirst({
    where: {
      restaurantId: restaurant.id,
      channel: "whatsapp",
      externalId: inbound.from,
    },
    orderBy: { updatedAt: "desc" },
  });
  if (!session) {
    session = await prisma.conversationSession.create({
      data: {
        restaurantId: restaurant.id,
        channel: "whatsapp",
        externalId: inbound.from,
      },
    });
  }

  const history = await prisma.conversationMessage.findMany({
    where: { sessionId: session.id },
    orderBy: { createdAt: "asc" },
  });

  await prisma.conversationMessage.create({
    data: { sessionId: session.id, role: "user", content: inbound.text },
  });

  const { reply } = await runAgentTurn({
    restaurantId: restaurant.id,
    sessionId: session.id,
    history: history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    userMessage: inbound.text,
    channel: "whatsapp",
  });

  await prisma.conversationMessage.create({
    data: { sessionId: session.id, role: "assistant", content: reply },
  });

  await sendWhatsAppMessage(inbound.from, reply);

  return NextResponse.json({ ok: true });
}

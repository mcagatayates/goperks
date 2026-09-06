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

// One webhook URL serves every restaurant on HeyTable — Meta always
// includes the destination phone_number_id in the payload, which is how we
// know which restaurant's WhatsAppConnection (and access token) to use.
export async function POST(request: Request) {
  const payload = await request.json();
  const inbound = parseWhatsAppWebhookPayload(payload);

  // Not a text message (status callback, image, etc.) — acknowledge and skip.
  if (!inbound) {
    return NextResponse.json({ ok: true });
  }

  const connection = await prisma.whatsAppConnection.findUnique({
    where: { phoneNumberId: inbound.phoneNumberId },
    include: { restaurant: true },
  });

  // No restaurant has connected this number (or it was disconnected) —
  // nothing to do, but still acknowledge so Meta doesn't retry forever.
  if (!connection || connection.status !== "connected") {
    return NextResponse.json({ ok: true });
  }

  const restaurant = connection.restaurant;

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

  try {
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

    await sendWhatsAppMessage(
      inbound.from,
      reply,
      connection.phoneNumberId,
      connection.accessToken
    );
  } catch (err) {
    // Always ack Meta's webhook with 200 even when our own processing
    // fails (e.g. no ANTHROPIC_API_KEY yet) — a non-200 here makes Meta
    // retry the same message repeatedly.
    console.error("WhatsApp agent turn failed", err);
  }

  return NextResponse.json({ ok: true });
}

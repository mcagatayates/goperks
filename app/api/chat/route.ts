import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runAgentTurn } from "@/lib/agent";
import type { Channel } from "@/lib/types";

export async function POST(request: Request) {
  const body = await request.json();
  const { restaurantSlug, sessionId, message, channel } = body as {
    restaurantSlug?: string;
    sessionId?: string;
    message?: string;
    channel?: Channel;
  };

  if (!restaurantSlug || !message) {
    return NextResponse.json(
      { error: "restaurantSlug and message are required" },
      { status: 400 }
    );
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug: restaurantSlug },
  });
  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  let session = sessionId
    ? await prisma.conversationSession.findUnique({ where: { id: sessionId } })
    : null;

  if (!session) {
    session = await prisma.conversationSession.create({
      data: { restaurantId: restaurant.id, channel: channel ?? "web" },
    });
  }

  const history = await prisma.conversationMessage.findMany({
    where: { sessionId: session.id },
    orderBy: { createdAt: "asc" },
  });

  await prisma.conversationMessage.create({
    data: { sessionId: session.id, role: "user", content: message },
  });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      {
        error:
          "ANTHROPIC_API_KEY is not configured on the server. Add it to .env to enable the AI concierge.",
      },
      { status: 500 }
    );
  }

  try {
    const { reply } = await runAgentTurn({
      restaurantId: restaurant.id,
      sessionId: session.id,
      history: history.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      userMessage: message,
      channel: (channel ?? session.channel) as Channel,
    });

    await prisma.conversationMessage.create({
      data: { sessionId: session.id, role: "assistant", content: reply },
    });

    return NextResponse.json({ sessionId: session.id, reply });
  } catch (err) {
    console.error("Agent turn failed", err);
    return NextResponse.json(
      { error: "The AI concierge is temporarily unavailable." },
      { status: 502 }
    );
  }
}

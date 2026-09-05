import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import {
  cancelReservation,
  createReservation,
  findAvailableTables,
  findReservationForCustomer,
  modifyReservation,
  ReservationError,
} from "@/lib/reservations";
import type { Channel } from "@/lib/types";

const MODEL = "claude-sonnet-5";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const tools: Anthropic.Tool[] = [
  {
    name: "check_availability",
    description:
      "Check whether a table is available for a given date, time and party size. Always call this before create_reservation unless you already checked the exact same date/time/party size in this conversation.",
    input_schema: {
      type: "object",
      properties: {
        date: { type: "string", description: "Date in YYYY-MM-DD format" },
        time: { type: "string", description: "Time in 24h HH:MM format" },
        partySize: { type: "integer", description: "Number of guests" },
      },
      required: ["date", "time", "partySize"],
    },
  },
  {
    name: "create_reservation",
    description:
      "Create a confirmed table reservation. Only call this after the guest has explicitly confirmed the date, time, party size, and given their name and phone number.",
    input_schema: {
      type: "object",
      properties: {
        date: { type: "string", description: "Date in YYYY-MM-DD format" },
        time: { type: "string", description: "Time in 24h HH:MM format" },
        partySize: { type: "integer" },
        customerName: { type: "string" },
        customerPhone: { type: "string" },
        customerEmail: { type: "string" },
        notes: {
          type: "string",
          description:
            "Optional special requests, e.g. allergies, birthday, window seat.",
        },
      },
      required: ["date", "time", "partySize", "customerName", "customerPhone"],
    },
  },
  {
    name: "modify_reservation",
    description:
      "Change the date, time, party size, or notes of the guest's existing reservation found earlier in this conversation via find_reservation.",
    input_schema: {
      type: "object",
      properties: {
        reservationId: { type: "string" },
        date: { type: "string" },
        time: { type: "string" },
        partySize: { type: "integer" },
        notes: { type: "string" },
      },
      required: ["reservationId"],
    },
  },
  {
    name: "cancel_reservation",
    description: "Cancel an existing reservation by its id.",
    input_schema: {
      type: "object",
      properties: {
        reservationId: { type: "string" },
      },
      required: ["reservationId"],
    },
  },
  {
    name: "find_reservation",
    description:
      "Look up a guest's most recent active reservation by their phone number. Use this before modify_reservation or cancel_reservation if you don't already have the reservationId.",
    input_schema: {
      type: "object",
      properties: {
        customerPhone: { type: "string" },
      },
      required: ["customerPhone"],
    },
  },
  {
    name: "get_specials",
    description:
      "Get today's chef specials and highlighted menu items to suggest to the guest.",
    input_schema: {
      type: "object",
      properties: {
        date: {
          type: "string",
          description: "Optional YYYY-MM-DD, defaults to today",
        },
      },
    },
  },
  {
    name: "get_restaurant_info",
    description:
      "Get the restaurant's address, phone number, opening hours and description.",
    input_schema: { type: "object", properties: {} },
  },
];

function systemPrompt(restaurant: {
  name: string;
  description: string;
  address: string;
  phone: string;
  openTime: string;
  closeTime: string;
}) {
  return `You are the AI reservations concierge for "${restaurant.name}", a restaurant.
Restaurant info: ${restaurant.description}
Address: ${restaurant.address}. Phone: ${restaurant.phone}.
Open hours: ${restaurant.openTime}-${restaurant.closeTime}, every day.

Your job:
- Help guests book, change, or cancel a table reservation.
- Always confirm date, time, party size, name and phone number back to the guest before calling create_reservation.
- Proactively mention relevant chef specials once, when it feels natural (e.g. right after confirming a booking), using get_specials. Don't be pushy.
- If a requested time has no availability, offer the closest alternative times by checking nearby slots.
- Reply in the same language the guest is writing in.
- Be warm, concise, and efficient — guests are often booking on the go.
- Never invent availability, menu items, or reservation details — always use the tools.`;
}

type ChatTurnResult = {
  reply: string;
  toolCalls: { name: string; input: unknown; result: unknown }[];
};

export async function runAgentTurn(params: {
  restaurantId: string;
  sessionId: string;
  history: { role: "user" | "assistant"; content: string }[];
  userMessage: string;
  channel: Channel;
}): Promise<ChatTurnResult> {
  const restaurant = await prisma.restaurant.findUniqueOrThrow({
    where: { id: params.restaurantId },
  });

  const messages: Anthropic.MessageParam[] = [
    ...params.history.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    { role: "user" as const, content: params.userMessage },
  ];

  const toolCalls: ChatTurnResult["toolCalls"] = [];

  for (let iteration = 0; iteration < 6; iteration++) {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt(restaurant),
      tools,
      messages,
    });

    const textBlocks = response.content.filter(
      (block): block is Anthropic.TextBlock => block.type === "text"
    );
    const toolUseBlocks = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
    );

    if (toolUseBlocks.length === 0) {
      return {
        reply: textBlocks.map((b) => b.text).join("\n"),
        toolCalls,
      };
    }

    messages.push({ role: "assistant", content: response.content });

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of toolUseBlocks) {
      const result = await executeTool(
        block.name,
        block.input,
        params.restaurantId,
        params.sessionId,
        params.channel
      );
      toolCalls.push({ name: block.name, input: block.input, result });
      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: JSON.stringify(result),
      });
    }

    messages.push({ role: "user", content: toolResults });
  }

  return {
    reply:
      "I'm having trouble completing that request right now — could you try rephrasing, or call the restaurant directly?",
    toolCalls,
  };
}

async function executeTool(
  name: string,
  input: unknown,
  restaurantId: string,
  sessionId: string,
  channel: Channel
): Promise<unknown> {
  const args = input as Record<string, unknown>;
  try {
    switch (name) {
      case "check_availability": {
        const { availableTables } = await findAvailableTables({
          restaurantId,
          date: String(args.date),
          time: String(args.time),
          partySize: Number(args.partySize),
        });
        return {
          available: availableTables.length > 0,
          tableCount: availableTables.length,
        };
      }
      case "create_reservation": {
        const { reservation } = await createReservation({
          restaurantId,
          sessionId,
          date: String(args.date),
          time: String(args.time),
          partySize: Number(args.partySize),
          customerName: String(args.customerName),
          customerPhone: String(args.customerPhone),
          customerEmail: args.customerEmail
            ? String(args.customerEmail)
            : undefined,
          notes: args.notes ? String(args.notes) : undefined,
          channel,
        });
        return {
          success: true,
          reservationId: reservation.id,
          table: reservation.table?.name,
          startsAt: reservation.startsAt,
        };
      }
      case "modify_reservation": {
        const updated = await modifyReservation({
          reservationId: String(args.reservationId),
          date: args.date ? String(args.date) : undefined,
          time: args.time ? String(args.time) : undefined,
          partySize: args.partySize ? Number(args.partySize) : undefined,
          notes: args.notes ? String(args.notes) : undefined,
        });
        return {
          success: true,
          reservationId: updated.id,
          startsAt: updated.startsAt,
          partySize: updated.partySize,
        };
      }
      case "cancel_reservation": {
        const cancelled = await cancelReservation(String(args.reservationId));
        return { success: true, reservationId: cancelled.id };
      }
      case "find_reservation": {
        const reservation = await findReservationForCustomer({
          restaurantId,
          customerPhone: String(args.customerPhone),
        });
        if (!reservation) return { found: false };
        return {
          found: true,
          reservationId: reservation.id,
          startsAt: reservation.startsAt,
          partySize: reservation.partySize,
          table: reservation.table?.name,
        };
      }
      case "get_specials": {
        const specials = await prisma.menuItem.findMany({
          where: { restaurantId, isSpecial: true, isAvailable: true },
        });
        return {
          specials: specials.map((s) => ({
            name: s.name,
            description: s.description,
            price: s.price,
          })),
        };
      }
      case "get_restaurant_info": {
        const restaurant = await prisma.restaurant.findUniqueOrThrow({
          where: { id: restaurantId },
        });
        return {
          name: restaurant.name,
          description: restaurant.description,
          address: restaurant.address,
          phone: restaurant.phone,
          openTime: restaurant.openTime,
          closeTime: restaurant.closeTime,
        };
      }
      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (err) {
    if (err instanceof ReservationError) {
      return { error: err.message };
    }
    return { error: "Something went wrong handling that request." };
  }
}

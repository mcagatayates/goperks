import { randomBytes, createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";

// Generic POS/reservation-system integration (README's "What's next" item,
// since no specific vendor — Toast/Square/OpenTable/local Turkish POS —
// is chosen yet). Two directions, both opt-in per restaurant from the
// dashboard's Settings tab:
//
// - Push: notifyPosWebhook() POSTs reservation/waitlist events to a URL
//   the restaurant configures, signed the same way Stripe/GitHub sign
//   webhooks (HMAC-SHA256 over the raw body) so their receiving end can
//   verify it really came from HeyTable.
// - Pull: /api/restaurants/[slug]/pos/reservations lets their POS (or a
//   Zapier/Make bridge) poll current reservations, authenticated with a
//   restaurant-scoped API key instead of the owner's login session, since
//   the caller here is a machine, not the dashboard.

export function generateApiKey(): string {
  return `htk_${randomBytes(24).toString("hex")}`;
}

export function generateWebhookSecret(): string {
  return randomBytes(24).toString("hex");
}

export function signWebhookBody(secret: string, rawBody: string): string {
  return createHmac("sha256", secret).update(rawBody).digest("hex");
}

export async function verifyApiKey(
  slug: string,
  authHeader: string | null
): Promise<{ id: string } | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const key = authHeader.slice("Bearer ".length).trim();
  if (!key) return null;

  const restaurant = await prisma.restaurant.findUnique({ where: { slug } });
  if (!restaurant?.apiKey) return null;

  const a = Buffer.from(key);
  const b = Buffer.from(restaurant.apiKey);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  return { id: restaurant.id };
}

export type PosEvent =
  | "reservation.created"
  | "reservation.updated"
  | "reservation.cancelled"
  | "waitlist.created";

export async function notifyPosWebhook(
  restaurant: { posWebhookUrl: string | null; posWebhookSecret: string | null },
  event: PosEvent,
  data: unknown
): Promise<void> {
  if (!restaurant.posWebhookUrl || !restaurant.posWebhookSecret) {
    console.log(`[pos webhook yapılandırılmadı] gönderilecekti: ${event}`);
    return;
  }

  const body = JSON.stringify({ event, data, sentAt: new Date().toISOString() });
  const signature = signWebhookBody(restaurant.posWebhookSecret, body);

  const res = await fetch(restaurant.posWebhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-HeyTable-Signature": signature,
    },
    body,
  });

  if (!res.ok) {
    console.error(`POS webhook gönderimi başarısız (${res.status}): ${event}`);
  }
}

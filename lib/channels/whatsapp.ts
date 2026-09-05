// Thin adapter around the WhatsApp Business Cloud API (Meta Graph API).
// The chat logic itself (lib/agent.ts) is channel-agnostic — this file is
// the only place that needs to change to go from "stubbed" to "live".
//
// To go live:
// 1. Create a Meta App + WhatsApp product, get a phone number ID and a
//    permanent access token.
// 2. Set WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN and
//    WHATSAPP_VERIFY_TOKEN in .env.
// 3. Point the app's webhook URL at POST /api/webhooks/whatsapp and verify
//    it using WHATSAPP_VERIFY_TOKEN (see the GET handler in that route).

export async function sendWhatsAppMessage(to: string, text: string) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    console.log(`[whatsapp:stub] would send to ${to}: ${text}`);
    return { stubbed: true };
  }

  const response = await fetch(
    `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text },
      }),
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`WhatsApp send failed (${response.status}): ${body}`);
  }

  return response.json();
}

export type WhatsAppInboundMessage = {
  from: string;
  text: string;
};

// Parses the subset of the Meta Cloud API webhook payload we care about:
// a single incoming text message. Returns null for anything else (status
// updates, non-text messages, etc.) so the caller can just no-op.
export function parseWhatsAppWebhookPayload(
  payload: unknown
): WhatsAppInboundMessage | null {
  try {
    const body = payload as {
      entry?: {
        changes?: {
          value?: {
            messages?: { from: string; type: string; text?: { body: string } }[];
          };
        }[];
      }[];
    };
    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!message || message.type !== "text" || !message.text) return null;
    return { from: message.from, text: message.text.body };
  } catch {
    return null;
  }
}

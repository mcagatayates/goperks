// Thin adapter around the WhatsApp Business Cloud API (Meta Graph API).
// The chat logic itself (lib/agent.ts) is channel-agnostic — this file only
// speaks the Cloud API's message format.
//
// Credentials are per-restaurant (see prisma schema's WhatsAppConnection,
// populated by lib/whatsapp-onboarding.ts's Embedded Signup flow) rather
// than a single global env var — a HeyTable deployment serves many
// restaurants, each with their own WhatsApp Business number.

export async function sendWhatsAppMessage(
  to: string,
  text: string,
  phoneNumberId: string,
  accessToken: string
) {
  if (!accessToken) {
    console.log(`[whatsapp:stub] would send to ${to}: ${text}`);
    return { stubbed: true };
  }

  const response = await fetch(
    `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
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
  phoneNumberId: string;
};

// Parses the subset of the Meta Cloud API webhook payload we care about:
// a single incoming text message, plus the destination phone_number_id
// (which restaurant's WhatsApp number this arrived on). Returns null for
// anything else (status updates, non-text messages, etc.) so the caller
// can just no-op.
export function parseWhatsAppWebhookPayload(
  payload: unknown
): WhatsAppInboundMessage | null {
  try {
    const body = payload as {
      entry?: {
        changes?: {
          value?: {
            metadata?: { phone_number_id?: string };
            messages?: { from: string; type: string; text?: { body: string } }[];
          };
        }[];
      }[];
    };
    const value = body.entry?.[0]?.changes?.[0]?.value;
    const message = value?.messages?.[0];
    const phoneNumberId = value?.metadata?.phone_number_id;
    if (!message || message.type !== "text" || !message.text || !phoneNumberId) {
      return null;
    }
    return { from: message.from, text: message.text.body, phoneNumberId };
  } catch {
    return null;
  }
}

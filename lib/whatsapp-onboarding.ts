// Server-side half of Meta's WhatsApp Embedded Signup (v4) flow — the
// self-service "Connect WhatsApp" button in the dashboard.
//
// This lets a restaurant owner connect their own WhatsApp Business number
// without us touching Meta Business Manager on their behalf. It requires
// HeyTable to already be registered as a Meta Tech Provider (business
// verification on Meta's side — see README's "WhatsApp self-service
// onboarding" section for exactly what that involves and why it can't be
// done from code). Until META_APP_ID / META_APP_SECRET are set, this whole
// flow stays inert and the dashboard shows a "not configured yet" state
// instead of a broken button.
//
// Flow (matches Meta's documented Embedded Signup v4 contract):
// 1. Dashboard loads the Facebook JS SDK and calls FB.login() with our
//    embedded-signup configuration ID. The user picks/creates their WABA
//    and phone number inside Meta's own popup — we never see credentials.
// 2. FB.login's callback gives us a short-lived `code`; a `message`
//    postEvent from the popup gives us the `waba_id` and `phone_number_id`
//    the user selected.
// 3. The dashboard POSTs all three to /api/restaurants/[slug]/whatsapp/connect.
// 4. We exchange the code for an access token (this file), then subscribe
//    our app to that WABA's webhooks so inbound messages start arriving at
//    POST /api/webhooks/whatsapp.

const GRAPH_API_VERSION = "v21.0";
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export class WhatsAppOnboardingError extends Error {}

export function isMetaConfigured() {
  return Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET);
}

export async function exchangeCodeForAccessToken(
  code: string
): Promise<string> {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) {
    throw new WhatsAppOnboardingError(
      "Sunucuda META_APP_ID/META_APP_SECRET tanımlı değil."
    );
  }

  const url = new URL(`${GRAPH_API_BASE}/oauth/access_token`);
  url.searchParams.set("client_id", appId);
  url.searchParams.set("client_secret", appSecret);
  url.searchParams.set("code", code);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const body = await res.text();
    throw new WhatsAppOnboardingError(
      `Meta token değişimi başarısız oldu (${res.status}): ${body}`
    );
  }
  const data = await res.json();
  if (!data.access_token) {
    throw new WhatsAppOnboardingError(
      "Meta token değişimi başarılı oldu ama access_token dönmedi."
    );
  }
  return data.access_token as string;
}

// Registers our app's webhook against the business's own WABA so their
// inbound WhatsApp messages start reaching POST /api/webhooks/whatsapp.
export async function subscribeAppToWaba(wabaId: string, accessToken: string) {
  const res = await fetch(
    `${GRAPH_API_BASE}/${wabaId}/subscribed_apps`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!res.ok) {
    const body = await res.text();
    throw new WhatsAppOnboardingError(
      `WABA webhook aboneliği başarısız oldu (${res.status}): ${body}`
    );
  }
}

// Fetches the human-readable number (e.g. "+90 555 000 00 00") for display
// in the dashboard, so the connected state doesn't just show raw IDs.
export async function getDisplayPhoneNumber(
  phoneNumberId: string,
  accessToken: string
): Promise<string> {
  const res = await fetch(
    `${GRAPH_API_BASE}/${phoneNumberId}?fields=display_phone_number`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) {
    throw new WhatsAppOnboardingError(
      `Telefon numarasının görünen adı okunamadı (${res.status}).`
    );
  }
  const data = await res.json();
  return data.display_phone_number as string;
}

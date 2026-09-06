// Reservation confirmation/cancellation SMS via Twilio's REST API — plain
// fetch() with HTTP Basic Auth rather than the Twilio SDK, same rationale
// as email.ts. Until all three env vars are set, sends are logged instead
// of attempted.
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM_NUMBER = process.env.TWILIO_FROM_NUMBER;

export function isSmsConfigured() {
  return Boolean(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_FROM_NUMBER);
}

export async function sendSms(params: {
  to: string;
  body: string;
}): Promise<void> {
  if (!isSmsConfigured()) {
    console.log(`[sms yapılandırılmadı] ${params.to} numarasına gönderilecekti: "${params.body}"`);
    return;
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString(
    "base64"
  );
  const body = new URLSearchParams({
    To: params.to,
    From: TWILIO_FROM_NUMBER!,
    Body: params.body,
  });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`Twilio SMS gönderimi başarısız (${res.status}): ${text}`);
  }
}

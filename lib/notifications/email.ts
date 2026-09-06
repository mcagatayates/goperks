// Reservation confirmation/cancellation email via Resend's HTTP API — a
// plain fetch() call rather than their SDK, matching this project's
// no-extra-dependency style for outbound integrations (see
// lib/whatsapp-onboarding.ts). Until RESEND_API_KEY is set, sends are
// logged to the console instead of attempted, same "not configured yet"
// treatment as the WhatsApp channel gets before Meta is set up.
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL =
  process.env.NOTIFICATIONS_FROM_EMAIL || "HeyTable <onboarding@resend.dev>";

export function isEmailConfigured() {
  return Boolean(RESEND_API_KEY);
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  if (!isEmailConfigured()) {
    console.log(
      `[e-posta yapılandırılmadı] ${params.to} adresine gönderilecekti: "${params.subject}"`
    );
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: params.to,
      subject: params.subject,
      html: params.html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`Resend e-posta gönderimi başarısız (${res.status}): ${body}`);
  }
}

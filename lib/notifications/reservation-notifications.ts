import { formatDate, formatTime } from "@/lib/time";
import { sendEmail } from "@/lib/notifications/email";
import { sendSms } from "@/lib/notifications/sms";

// Best-effort side channel: a reservation is already confirmed in the
// database by the time these run, so a notification failure must never
// surface as a reservation failure — every call site wraps this in
// try/catch and only logs.
export async function notifyReservationConfirmed(params: {
  restaurantName: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  startsAt: Date;
  partySize: number;
}) {
  const date = formatDate(params.startsAt);
  const time = formatTime(params.startsAt);

  await sendSms({
    to: params.customerPhone,
    body: `${params.restaurantName}: Rezervasyonunuz onaylandı — ${date} ${time}, ${params.partySize} kişi. Sizi bekliyoruz!`,
  });

  if (params.customerEmail) {
    await sendEmail({
      to: params.customerEmail,
      subject: `${params.restaurantName} — Rezervasyon onayı`,
      html: `<p>Merhaba ${params.customerName},</p><p><strong>${params.restaurantName}</strong> için rezervasyonunuz onaylandı.</p><p><strong>Tarih:</strong> ${date}<br /><strong>Saat:</strong> ${time}<br /><strong>Kişi sayısı:</strong> ${params.partySize}</p><p>Görüşmek üzere!</p>`,
    });
  }
}

export async function notifyReservationCancelled(params: {
  restaurantName: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  startsAt: Date;
}) {
  const date = formatDate(params.startsAt);
  const time = formatTime(params.startsAt);

  await sendSms({
    to: params.customerPhone,
    body: `${params.restaurantName}: ${date} ${time} saatindeki rezervasyonunuz iptal edildi.`,
  });

  if (params.customerEmail) {
    await sendEmail({
      to: params.customerEmail,
      subject: `${params.restaurantName} — Rezervasyon iptal edildi`,
      html: `<p>Merhaba ${params.customerName},</p><p><strong>${params.restaurantName}</strong> için ${date} ${time} saatindeki rezervasyonunuz iptal edildi.</p>`,
    });
  }
}

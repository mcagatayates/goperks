import { prisma } from "@/lib/prisma";
import { notifyPosWebhook } from "@/lib/pos";

export class WaitlistError extends Error {}

export async function addToWaitlist(params: {
  restaurantId: string;
  sessionId?: string;
  date: string;
  time: string;
  partySize: number;
  customerName: string;
  customerPhone: string;
  notes?: string;
}) {
  if (!params.customerName.trim()) {
    throw new WaitlistError("Misafir adı gereklidir.");
  }
  if (!params.customerPhone.trim()) {
    throw new WaitlistError("Misafir telefon numarası gereklidir.");
  }
  if (!Number.isInteger(params.partySize) || params.partySize < 1) {
    throw new WaitlistError("Kişi sayısı en az 1 olmalıdır.");
  }

  const entry = await prisma.waitlistEntry.create({
    data: {
      restaurantId: params.restaurantId,
      sessionId: params.sessionId,
      requestedDate: params.date,
      requestedTime: params.time,
      partySize: params.partySize,
      customerName: params.customerName,
      customerPhone: params.customerPhone,
      notes: params.notes,
    },
  });

  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: params.restaurantId },
    });
    if (restaurant) {
      await notifyPosWebhook(restaurant, "waitlist.created", entry);
    }
  } catch (err) {
    console.error("POS webhook failed", err);
  }

  return entry;
}

export async function listWaitlist(restaurantId: string, date?: string) {
  return prisma.waitlistEntry.findMany({
    where: {
      restaurantId,
      ...(date ? { requestedDate: date } : {}),
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function updateWaitlistStatus(id: string, status: string) {
  return prisma.waitlistEntry.update({ where: { id }, data: { status } });
}

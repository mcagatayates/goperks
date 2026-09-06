import { prisma } from "@/lib/prisma";
import {
  addMinutes,
  combineDateAndTime,
  minutesOfDay,
  rangesOverlap,
  timeStringToMinutes,
} from "@/lib/time";
import {
  notifyReservationCancelled,
  notifyReservationConfirmed,
} from "@/lib/notifications/reservation-notifications";
import { notifyPosWebhook } from "@/lib/pos";
import type { Channel } from "@/lib/types";

export class ReservationError extends Error {}

async function getRestaurantOrThrow(restaurantId: string) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
  });
  if (!restaurant) throw new ReservationError("Restoran bulunamadı.");
  return restaurant;
}

function assertNotPastDate(date: string) {
  // Calendar-day comparison only (not exact hour) — see the timezone
  // simplification documented in lib/time.ts, which makes hour-level
  // comparisons against the real clock unreliable.
  const todayStr = new Date().toISOString().slice(0, 10);
  if (date < todayStr) {
    throw new ReservationError("Geçmiş bir tarih için rezervasyon yapılamaz.");
  }
}

function assertValidPartySize(partySize: number) {
  if (!Number.isInteger(partySize) || partySize < 1) {
    throw new ReservationError("Kişi sayısı en az 1 olmalıdır.");
  }
}

function assertWithinOpeningHours(
  restaurant: { openTime: string; closeTime: string },
  startsAt: Date,
  durationMinutes: number
) {
  const open = timeStringToMinutes(restaurant.openTime);
  const close = timeStringToMinutes(restaurant.closeTime);
  const start = minutesOfDay(startsAt);
  const end = start + durationMinutes;
  // Allow the reservation to run up to 15 minutes past closing (last seating).
  if (start < open || start > close || end > close + 15) {
    throw new ReservationError(
      `Talep edilen saat çalışma saatleri dışında (${restaurant.openTime}-${restaurant.closeTime}).`
    );
  }
}

export async function findAvailableTables(params: {
  restaurantId: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:MM"
  partySize: number;
  excludeReservationId?: string;
}) {
  assertValidPartySize(params.partySize);
  assertNotPastDate(params.date);
  const restaurant = await getRestaurantOrThrow(params.restaurantId);
  const startsAt = combineDateAndTime(params.date, params.time);
  const durationMinutes = restaurant.reservationDurationMinutes;
  assertWithinOpeningHours(restaurant, startsAt, durationMinutes);
  const endsAt = addMinutes(startsAt, durationMinutes);

  const tables = await prisma.restaurantTable.findMany({
    where: {
      restaurantId: params.restaurantId,
      isActive: true,
      capacity: { gte: params.partySize },
    },
    orderBy: { capacity: "asc" },
  });

  const dayStart = combineDateAndTime(params.date, "00:00");
  const dayEnd = addMinutes(dayStart, 24 * 60);
  const existingReservations = await prisma.reservation.findMany({
    where: {
      restaurantId: params.restaurantId,
      status: { in: ["pending", "confirmed"] },
      startsAt: { gte: dayStart, lt: dayEnd },
      ...(params.excludeReservationId
        ? { id: { not: params.excludeReservationId } }
        : {}),
    },
  });

  const availableTables = tables.filter((table) => {
    const conflicting = existingReservations.some((res) => {
      if (res.tableId !== table.id) return false;
      const resEnd = addMinutes(res.startsAt, res.durationMinutes);
      return rangesOverlap(startsAt, endsAt, res.startsAt, resEnd);
    });
    return !conflicting;
  });

  return { restaurant, startsAt, durationMinutes, availableTables };
}

export async function createReservation(params: {
  restaurantId: string;
  sessionId?: string;
  date: string;
  time: string;
  partySize: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  notes?: string;
  channel?: Channel;
}) {
  if (!params.customerName.trim()) {
    throw new ReservationError("Misafir adı gereklidir.");
  }
  if (!params.customerPhone.trim()) {
    throw new ReservationError("Misafir telefon numarası gereklidir.");
  }

  const { restaurant, startsAt, durationMinutes, availableTables } =
    await findAvailableTables({
      restaurantId: params.restaurantId,
      date: params.date,
      time: params.time,
      partySize: params.partySize,
    });

  if (availableTables.length === 0) {
    throw new ReservationError(
      "Bu tarih, saat ve kişi sayısı için uygun masa yok."
    );
  }

  const table = availableTables[0];

  const reservation = await prisma.reservation.create({
    data: {
      restaurantId: params.restaurantId,
      tableId: table.id,
      sessionId: params.sessionId,
      customerName: params.customerName,
      customerPhone: params.customerPhone,
      customerEmail: params.customerEmail,
      partySize: params.partySize,
      startsAt,
      durationMinutes,
      status: "confirmed",
      channel: params.channel ?? "web",
      notes: params.notes,
    },
    include: { table: true },
  });

  try {
    await notifyReservationConfirmed({
      restaurantName: restaurant.name,
      customerName: reservation.customerName,
      customerPhone: reservation.customerPhone,
      customerEmail: reservation.customerEmail,
      startsAt: reservation.startsAt,
      partySize: reservation.partySize,
    });
  } catch (err) {
    console.error("Reservation confirmation notification failed", err);
  }
  try {
    await notifyPosWebhook(restaurant, "reservation.created", reservation);
  } catch (err) {
    console.error("POS webhook failed", err);
  }

  return { reservation, restaurant };
}

export async function modifyReservation(params: {
  reservationId: string;
  date?: string;
  time?: string;
  partySize?: number;
  notes?: string;
}) {
  const existing = await prisma.reservation.findUnique({
    where: { id: params.reservationId },
    include: { restaurant: true },
  });
  if (!existing) throw new ReservationError("Rezervasyon bulunamadı.");
  if (existing.status === "cancelled") {
    throw new ReservationError("Bu rezervasyon zaten iptal edilmiş.");
  }

  const date = params.date ?? existing.startsAt.toISOString().slice(0, 10);
  const time =
    params.time ??
    `${String(existing.startsAt.getUTCHours()).padStart(2, "0")}:${String(
      existing.startsAt.getUTCMinutes()
    ).padStart(2, "0")}`;
  const partySize = params.partySize ?? existing.partySize;

  const { startsAt, durationMinutes, availableTables } =
    await findAvailableTables({
      restaurantId: existing.restaurantId,
      date,
      time,
      partySize,
      excludeReservationId: existing.id,
    });

  if (availableTables.length === 0) {
    throw new ReservationError(
      "Yeni tarih, saat ve kişi sayısı için uygun masa yok."
    );
  }

  const updated = await prisma.reservation.update({
    where: { id: existing.id },
    data: {
      startsAt,
      durationMinutes,
      partySize,
      tableId: availableTables[0].id,
      notes: params.notes ?? existing.notes,
    },
    include: { table: true },
  });

  try {
    await notifyPosWebhook(existing.restaurant, "reservation.updated", updated);
  } catch (err) {
    console.error("POS webhook failed", err);
  }

  return updated;
}

export async function cancelReservation(reservationId: string) {
  const existing = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { restaurant: true },
  });
  if (!existing) throw new ReservationError("Rezervasyon bulunamadı.");

  const cancelled = await prisma.reservation.update({
    where: { id: reservationId },
    data: { status: "cancelled" },
  });

  try {
    await notifyReservationCancelled({
      restaurantName: existing.restaurant.name,
      customerName: existing.customerName,
      customerPhone: existing.customerPhone,
      customerEmail: existing.customerEmail,
      startsAt: existing.startsAt,
    });
  } catch (err) {
    console.error("Reservation cancellation notification failed", err);
  }
  try {
    await notifyPosWebhook(existing.restaurant, "reservation.cancelled", cancelled);
  } catch (err) {
    console.error("POS webhook failed", err);
  }

  return cancelled;
}

// Blocks a table for a booking that lives in the restaurant's *other*
// reservation system, not one taken through HeyTable — pushed in via
// POST /api/restaurants/[slug]/pos/external-bookings once a restaurant
// wires up their existing POS/reservation software (or a Zapier/Make
// bridge) to call it. This exists purely so our own availability engine
// doesn't double-book a table their other system already holds; it
// deliberately skips the guest SMS/email confirmation (we may not have a
// real relationship with that guest) and skips re-firing the outbound POS
// webhook (the event originated from their side — echoing it back out
// would loop).
export async function upsertExternalReservation(params: {
  restaurantId: string;
  externalId: string;
  date: string;
  time: string;
  partySize: number;
  tableName?: string;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
}) {
  assertValidPartySize(params.partySize);
  assertNotPastDate(params.date);
  const restaurant = await getRestaurantOrThrow(params.restaurantId);
  const startsAt = combineDateAndTime(params.date, params.time);
  const durationMinutes = restaurant.reservationDurationMinutes;
  assertWithinOpeningHours(restaurant, startsAt, durationMinutes);
  const endsAt = addMinutes(startsAt, durationMinutes);

  const existing = await prisma.reservation.findFirst({
    where: { restaurantId: params.restaurantId, externalId: params.externalId },
  });

  let tableId: string;

  if (params.tableName) {
    const table = await prisma.restaurantTable.findFirst({
      where: {
        restaurantId: params.restaurantId,
        name: params.tableName,
        isActive: true,
      },
    });
    if (!table) {
      throw new ReservationError(
        `"${params.tableName}" adında aktif bir masa bulunamadı.`
      );
    }
    if (table.capacity < params.partySize) {
      throw new ReservationError(
        `"${params.tableName}" masası ${params.partySize} kişi için yetersiz kapasitede.`
      );
    }

    const dayStart = combineDateAndTime(params.date, "00:00");
    const dayEnd = addMinutes(dayStart, 24 * 60);
    const conflicting = await prisma.reservation.findMany({
      where: {
        restaurantId: params.restaurantId,
        tableId: table.id,
        status: { in: ["pending", "confirmed"] },
        startsAt: { gte: dayStart, lt: dayEnd },
        ...(existing ? { id: { not: existing.id } } : {}),
      },
    });
    const overlap = conflicting.some((res) =>
      rangesOverlap(
        startsAt,
        endsAt,
        res.startsAt,
        addMinutes(res.startsAt, res.durationMinutes)
      )
    );
    if (overlap) {
      throw new ReservationError(
        `"${params.tableName}" masası bu saat için zaten dolu.`
      );
    }
    tableId = table.id;
  } else {
    const { availableTables } = await findAvailableTables({
      restaurantId: params.restaurantId,
      date: params.date,
      time: params.time,
      partySize: params.partySize,
      excludeReservationId: existing?.id,
    });
    if (availableTables.length === 0) {
      throw new ReservationError(
        "Bu tarih, saat ve kişi sayısı için uygun masa yok."
      );
    }
    tableId = availableTables[0].id;
  }

  const data = {
    restaurantId: params.restaurantId,
    tableId,
    externalId: params.externalId,
    customerName: params.customerName?.trim() || "Dış sistem rezervasyonu",
    customerPhone: params.customerPhone?.trim() || "-",
    partySize: params.partySize,
    startsAt,
    durationMinutes,
    status: "confirmed",
    channel: "external",
    notes: params.notes,
  } as const;

  return existing
    ? prisma.reservation.update({
        where: { id: existing.id },
        data,
        include: { table: true },
      })
    : prisma.reservation.create({ data, include: { table: true } });
}

export async function cancelExternalReservation(
  restaurantId: string,
  externalId: string
) {
  const existing = await prisma.reservation.findFirst({
    where: { restaurantId, externalId },
  });
  if (!existing) {
    throw new ReservationError("Dış sistem rezervasyonu bulunamadı.");
  }
  return prisma.reservation.update({
    where: { id: existing.id },
    data: { status: "cancelled" },
  });
}

export async function findReservationForCustomer(params: {
  restaurantId: string;
  customerPhone: string;
}) {
  return prisma.reservation.findFirst({
    where: {
      restaurantId: params.restaurantId,
      customerPhone: params.customerPhone,
      status: { in: ["pending", "confirmed"] },
    },
    orderBy: { startsAt: "desc" },
    include: { table: true },
  });
}

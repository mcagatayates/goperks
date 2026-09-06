import { prisma } from "@/lib/prisma";
import {
  addMinutes,
  combineDateAndTime,
  minutesOfDay,
  rangesOverlap,
  timeStringToMinutes,
} from "@/lib/time";
import type { Channel } from "@/lib/types";

export class ReservationError extends Error {}

async function getRestaurantOrThrow(restaurantId: string) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
  });
  if (!restaurant) throw new ReservationError("Restaurant not found");
  return restaurant;
}

function assertNotPastDate(date: string) {
  // Calendar-day comparison only (not exact hour) — see the timezone
  // simplification documented in lib/time.ts, which makes hour-level
  // comparisons against the real clock unreliable.
  const todayStr = new Date().toISOString().slice(0, 10);
  if (date < todayStr) {
    throw new ReservationError("Cannot book a reservation for a past date.");
  }
}

function assertValidPartySize(partySize: number) {
  if (!Number.isInteger(partySize) || partySize < 1) {
    throw new ReservationError("Party size must be at least 1.");
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
      `Requested time is outside opening hours (${restaurant.openTime}-${restaurant.closeTime}).`
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
    throw new ReservationError("Guest name is required.");
  }
  if (!params.customerPhone.trim()) {
    throw new ReservationError("Guest phone number is required.");
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
      "No tables are available for that date, time and party size."
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
  if (!existing) throw new ReservationError("Reservation not found");
  if (existing.status === "cancelled") {
    throw new ReservationError("This reservation was already cancelled.");
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
      "No tables are available for the new date, time and party size."
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

  return updated;
}

export async function cancelReservation(reservationId: string) {
  const existing = await prisma.reservation.findUnique({
    where: { id: reservationId },
  });
  if (!existing) throw new ReservationError("Reservation not found");

  return prisma.reservation.update({
    where: { id: reservationId },
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

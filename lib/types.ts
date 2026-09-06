export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "no_show";

// "staff" = entered directly in the dashboard (phone call taken by the
// host, or a walk-in) rather than through an AI conversation.
// "external" = pushed in from the restaurant's other reservation system
// (see lib/reservations.ts's upsertExternalReservation) — exists purely to
// block a table in our own availability engine, not a HeyTable booking.
export type Channel = "web" | "whatsapp" | "voice" | "staff" | "external";

export type MessageRole = "user" | "assistant";

export const RESERVATION_STATUSES: ReservationStatus[] = [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
  "no_show",
];

export const CHANNELS: Channel[] = [
  "web",
  "whatsapp",
  "voice",
  "staff",
  "external",
];

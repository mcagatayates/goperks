export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "no_show";

// "staff" = entered directly in the dashboard (phone call taken by the
// host, or a walk-in) rather than through an AI conversation.
export type Channel = "web" | "whatsapp" | "voice" | "staff";

export type MessageRole = "user" | "assistant";

export const RESERVATION_STATUSES: ReservationStatus[] = [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
  "no_show",
];

export const CHANNELS: Channel[] = ["web", "whatsapp", "voice", "staff"];

export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "no_show";

export type Channel = "web" | "whatsapp" | "voice";

export type MessageRole = "user" | "assistant";

export const RESERVATION_STATUSES: ReservationStatus[] = [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
  "no_show",
];

export const CHANNELS: Channel[] = ["web", "whatsapp", "voice"];

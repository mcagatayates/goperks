// Simplification for this prototype: a restaurant operates in a single
// timezone, and we represent every wall-clock moment as a UTC Date whose
// UTC hours/minutes ARE the local hours/minutes (i.e. we never do real
// timezone math). This keeps the demo self-contained without pulling in a
// timezone library. A production build would store `restaurant.timezone`
// (already in the schema) and convert properly.

export function combineDateAndTime(dateStr: string, timeStr: string): Date {
  // dateStr: "2026-09-10", timeStr: "19:30"
  return new Date(`${dateStr}T${timeStr}:00.000Z`);
}

export function minutesOfDay(date: Date): number {
  return date.getUTCHours() * 60 + date.getUTCMinutes();
}

export function timeStringToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function formatTime(date: Date): string {
  const h = String(date.getUTCHours()).padStart(2, "0");
  const m = String(date.getUTCMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

export function rangesOverlap(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date
): boolean {
  return startA < endB && startB < endA;
}

import { CUISINES } from "../data/options";
import type { ScoredPlace } from "../types";

const CUISINE_EMOJI: Record<string, string> = Object.fromEntries(
  CUISINES.filter((c) => c.key !== "any").map((c) => [c.key, c.emoji]),
);

export function emojiForPlace(place: ScoredPlace): string {
  for (const cuisine of CUISINES) {
    if (cuisine.key === "any") continue;
    if (place.cuisineTags.some((tag) => cuisine.match.some((kw) => tag.includes(kw)))) {
      return CUISINE_EMOJI[cuisine.key] ?? "🍽️";
    }
  }
  if (place.amenity === "cafe") return "☕";
  return "🍽️";
}

export function cuisineLabelForPlace(place: ScoredPlace): string | undefined {
  const tag = place.cuisineTags[0];
  if (!tag) return undefined;
  return tag
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function directionsUrl(place: { lat: number; lon: number; name: string }): string {
  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  url.searchParams.set("destination", `${place.lat},${place.lon}`);
  return url.toString();
}

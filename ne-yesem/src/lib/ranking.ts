import { CUISINES } from "../data/options";
import { haversineMeters } from "./distance";
import type { RawPlace, ScoredPlace } from "../types";

export function toggleCuisineSelection(current: string[], key: string): string[] {
  if (key === "any") return ["any"];
  let next = current.filter((k) => k !== "any");
  next = next.includes(key) ? next.filter((k) => k !== key) : [...next, key];
  return next.length === 0 ? ["any"] : next;
}

function cuisineKeywords(cuisineKeys: string[]): string[] {
  return CUISINES.filter((c) => cuisineKeys.includes(c.key)).flatMap((c) => c.match);
}

export function scorePlaces(
  raw: RawPlace[],
  origin: { lat: number; lon: number },
  radiusMeters: number,
  cuisineKeys: string[],
): ScoredPlace[] {
  const wantsAny = cuisineKeys.length === 0 || cuisineKeys.includes("any");
  const keywords = wantsAny ? [] : cuisineKeywords(cuisineKeys);

  return raw
    .map((place) => {
      const distanceMeters = haversineMeters(origin.lat, origin.lon, place.lat, place.lon);
      const proximityScore = Math.max(0, 1 - distanceMeters / radiusMeters);

      const matchedCuisine =
        !wantsAny && keywords.length > 0
          ? place.cuisineTags.some((tag) => keywords.some((kw) => tag.includes(kw)))
          : false;

      let cuisineScore = 0;
      if (wantsAny) {
        cuisineScore = 0.5;
      } else if (matchedCuisine) {
        cuisineScore = 1;
      } else if (place.cuisineTags.length === 0) {
        cuisineScore = 0.3;
      } else {
        cuisineScore = 0.05;
      }

      const score = proximityScore * 0.55 + cuisineScore * 0.45;

      return { ...place, distanceMeters, score, matchedCuisine };
    })
    .filter((p) => p.distanceMeters <= radiusMeters * 1.05)
    .sort((a, b) => b.score - a.score);
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const POOL_SIZE = 10;

export function pickThree(
  scored: ScoredPlace[],
  excludeIds: Set<string>,
): { picks: ScoredPlace[]; exhausted: boolean } {
  let pool = scored.filter((p) => !excludeIds.has(p.id));
  let exhausted = false;

  if (pool.length < 3) {
    pool = scored;
    exhausted = true;
  }

  const topPool = pool.slice(0, Math.min(POOL_SIZE, pool.length));
  const picks = shuffle(topPool).slice(0, Math.min(3, topPool.length));

  return { picks, exhausted };
}

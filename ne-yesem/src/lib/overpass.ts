import type { PlaceType, RawPlace } from "../types";

const ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

function amenityFilter(placeType: PlaceType): string {
  if (placeType === "restaurant") return "restaurant";
  if (placeType === "cafe") return "cafe";
  return "restaurant|cafe";
}

function buildQuery(lat: number, lon: number, radius: number, placeType: PlaceType): string {
  const filter = amenityFilter(placeType);
  return `[out:json][timeout:20];(
    node["amenity"~"^(${filter})$"](around:${radius},${lat},${lon});
    way["amenity"~"^(${filter})$"](around:${radius},${lat},${lon});
  );out center tags;`;
}

interface OverpassElement {
  type: "node" | "way";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements: OverpassElement[];
}

export class OverpassError extends Error {}

export async function fetchNearbyPlaces(
  lat: number,
  lon: number,
  radiusMeters: number,
  placeType: PlaceType,
): Promise<RawPlace[]> {
  const query = buildQuery(lat, lon, radiusMeters, placeType);
  let lastError: unknown;

  for (const endpoint of ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        body: new URLSearchParams({ data: query }),
      });

      if (!response.ok) {
        throw new OverpassError(`Overpass ${response.status}`);
      }

      const data = (await response.json()) as OverpassResponse;
      return parseElements(data.elements);
    } catch (error) {
      lastError = error;
    }
  }

  throw new OverpassError(
    lastError instanceof Error ? lastError.message : "Mekan verisine ulaşılamadı.",
  );
}

function parseElements(elements: OverpassElement[]): RawPlace[] {
  const places: RawPlace[] = [];

  for (const el of elements) {
    const tags = el.tags ?? {};
    const name = tags.name;
    if (!name) continue;

    const lat = el.type === "node" ? el.lat : el.center?.lat;
    const lon = el.type === "node" ? el.lon : el.center?.lon;
    if (lat == null || lon == null) continue;

    const cuisineTags = (tags.cuisine ?? "")
      .split(/[;,]/)
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const addressParts = [tags["addr:street"], tags["addr:housenumber"]].filter(Boolean);

    places.push({
      id: `${el.type}/${el.id}`,
      name,
      lat,
      lon,
      amenity: tags.amenity ?? "restaurant",
      cuisineTags,
      address: addressParts.length ? addressParts.join(" ") : undefined,
      openingHours: tags.opening_hours,
      website: tags.website ?? tags["contact:website"],
      phone: tags.phone ?? tags["contact:phone"],
    });
  }

  return places;
}

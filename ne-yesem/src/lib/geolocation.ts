export interface Coordinates {
  lat: number;
  lon: number;
  label?: string;
}

export type LocationErrorReason = "denied" | "unavailable" | "timeout" | "unsupported" | "not_found";

export class LocationError extends Error {
  reason: LocationErrorReason;
  constructor(reason: LocationErrorReason, message: string) {
    super(message);
    this.reason = reason;
  }
}

export function getCurrentPosition(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new LocationError("unsupported", "Bu tarayıcı konum özelliğini desteklemiyor."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({ lat: position.coords.latitude, lon: position.coords.longitude });
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          reject(new LocationError("denied", "Konum izni verilmedi."));
        } else if (error.code === error.TIMEOUT) {
          reject(new LocationError("timeout", "Konum alma zaman aşımına uğradı."));
        } else {
          reject(new LocationError("unavailable", "Konum alınamadı."));
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 },
    );
  });
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

export async function geocodePlace(query: string): Promise<Coordinates> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "1");
  url.searchParams.set("accept-language", "tr");

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new LocationError("unavailable", "Konum arama servisine ulaşılamadı.");
  }

  const results = (await response.json()) as NominatimResult[];
  const first = results[0];
  if (!first) {
    throw new LocationError("not_found", "Bu isimde bir yer bulamadık.");
  }

  return { lat: parseFloat(first.lat), lon: parseFloat(first.lon), label: first.display_name };
}

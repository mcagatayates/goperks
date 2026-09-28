import { useState, type FormEvent } from "react";
import { LocateFixed, MapPin, Check, Loader2 } from "lucide-react";
import type { Coordinates } from "../lib/geolocation";
import { geocodePlace, getCurrentPosition, LocationError } from "../lib/geolocation";

interface LocationControlProps {
  coords: Coordinates | null;
  onLocated: (coords: Coordinates) => void;
}

export function LocationControl({ coords, onLocated }: LocationControlProps) {
  const [status, setStatus] = useState<"idle" | "locating" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [manualQuery, setManualQuery] = useState("");

  async function handleUseLocation() {
    setStatus("locating");
    setError(null);
    try {
      const position = await getCurrentPosition();
      onLocated(position);
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof LocationError
          ? err.message
          : "Konum alınamadı, aşağıdan semt veya şehir yazabilirsin.",
      );
    }
  }

  async function handleManualSubmit(e: FormEvent) {
    e.preventDefault();
    if (!manualQuery.trim()) return;
    setStatus("locating");
    setError(null);
    try {
      const position = await geocodePlace(manualQuery.trim());
      onLocated(position);
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setError(err instanceof LocationError ? err.message : "Bu konum bulunamadı.");
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleUseLocation}
        disabled={status === "locating"}
        className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition ${
          coords
            ? "border-sage-500/40 bg-sage-100"
            : "border-line bg-white hover:border-coral-300"
        }`}
      >
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
            coords ? "bg-sage-500 text-white" : "bg-coral-50 text-coral-600"
          }`}
        >
          {status === "locating" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : coords ? (
            <Check className="h-4 w-4" />
          ) : (
            <LocateFixed className="h-4 w-4" />
          )}
        </span>
        <span className="flex-1">
          <span className="block text-sm font-semibold text-ink">
            {coords ? "Konum alındı" : "Konumumu Kullan"}
          </span>
          <span className="block truncate text-xs text-ink-soft">
            {coords?.label ?? (coords ? `${coords.lat.toFixed(3)}, ${coords.lon.toFixed(3)}` : "Tek dokunuşla en yakın yerleri bulalım")}
          </span>
        </span>
      </button>

      <form onSubmit={handleManualSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <input
            value={manualQuery}
            onChange={(e) => setManualQuery(e.target.value)}
            placeholder="veya semt / şehir yaz (örn. Kadıköy)"
            className="w-full rounded-2xl border border-line bg-white py-3 pl-9 pr-3 text-sm outline-none placeholder:text-ink-soft/70 focus:border-coral-400"
          />
        </div>
        <button
          type="submit"
          disabled={status === "locating" || !manualQuery.trim()}
          className="rounded-2xl border border-line bg-white px-4 py-3 text-sm font-semibold text-ink-soft transition hover:border-coral-300 hover:text-coral-600 disabled:opacity-40"
        >
          Bul
        </button>
      </form>

      {error && <p className="text-xs font-medium text-coral-600">{error}</p>}
    </div>
  );
}

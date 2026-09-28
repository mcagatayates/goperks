import { motion } from "framer-motion";
import { Clock, MapPin, Navigation } from "lucide-react";
import { formatDistance } from "../lib/distance";
import { cuisineLabelForPlace, directionsUrl, emojiForPlace } from "../lib/present";
import type { ScoredPlace } from "../types";

interface ResultCardProps {
  place: ScoredPlace;
  index: number;
}

const AMENITY_LABEL: Record<string, string> = {
  restaurant: "Restoran",
  cafe: "Kafe",
};

export function ResultCard({ place, index }: ResultCardProps) {
  const cuisineLabel = cuisineLabelForPlace(place);

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, type: "spring", stiffness: 260, damping: 24 }}
      className="overflow-hidden rounded-3xl bg-white shadow-card"
    >
      <div className="flex items-center justify-between bg-gradient-to-br from-coral-50 to-cream-100 px-5 py-6">
        <span className="text-4xl" aria-hidden>
          {emojiForPlace(place)}
        </span>
        <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-coral-700">
          {AMENITY_LABEL[place.amenity] ?? "Mekan"}
        </span>
      </div>

      <div className="space-y-3 px-5 py-4">
        <h3 className="font-display text-lg font-semibold leading-snug text-ink">{place.name}</h3>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-soft">
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {formatDistance(place.distanceMeters)}
          </span>
          {cuisineLabel && place.matchedCuisine && <span>· {cuisineLabel}</span>}
          {place.openingHours && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {place.openingHours}
            </span>
          )}
        </div>

        {place.address && <p className="text-sm text-ink-soft">{place.address}</p>}

        <a
          href={directionsUrl(place)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 flex items-center justify-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-coral-600"
        >
          <Navigation className="h-4 w-4" />
          Yol Tarifi Al
        </a>
      </div>
    </motion.article>
  );
}

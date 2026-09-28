import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RefreshCw, Settings2, UtensilsCrossed } from "lucide-react";
import { CuisineChips } from "./components/CuisineChips";
import { EmptyState } from "./components/EmptyState";
import { ErrorState } from "./components/ErrorState";
import { LoadingState } from "./components/LoadingState";
import { LocationControl } from "./components/LocationControl";
import { PrimaryButton } from "./components/PrimaryButton";
import { ResultCard } from "./components/ResultCard";
import { SegmentedControl } from "./components/SegmentedControl";
import { DISTANCES } from "./data/options";
import type { Coordinates } from "./lib/geolocation";
import { OverpassError, fetchNearbyPlaces } from "./lib/overpass";
import { pickThree, scorePlaces, toggleCuisineSelection } from "./lib/ranking";
import type { DistanceKey, PlaceType, ScoredPlace } from "./types";

type Phase = "form" | "searching" | "results" | "empty" | "error";

const PLACE_TYPE_OPTIONS: { key: PlaceType; label: string }[] = [
  { key: "restaurant", label: "Restoran" },
  { key: "cafe", label: "Kafe" },
  { key: "both", label: "İkisi de" },
];

export default function App() {
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [placeType, setPlaceType] = useState<PlaceType>("both");
  const [cuisineKeys, setCuisineKeys] = useState<string[]>(["any"]);
  const [distance, setDistance] = useState<DistanceKey>("mid");

  const [phase, setPhase] = useState<Phase>("form");
  const [errorMessage, setErrorMessage] = useState("");
  const [widened, setWidened] = useState(false);

  const [pool, setPool] = useState<ScoredPlace[]>([]);
  const [picks, setPicks] = useState<ScoredPlace[]>([]);
  const [shownIds, setShownIds] = useState<Set<string>>(new Set());

  const distanceOption = useMemo(() => DISTANCES.find((d) => d.key === distance)!, [distance]);

  async function runSearch(radiusOverride?: number, hasWidened = false) {
    if (!coords) return;
    setPhase("searching");
    setErrorMessage("");

    const radius = radiusOverride ?? distanceOption.radiusMeters;

    try {
      const raw = await fetchNearbyPlaces(coords.lat, coords.lon, radius, placeType);
      const scored = scorePlaces(raw, coords, radius, cuisineKeys);

      if (scored.length === 0) {
        const nextTier = DISTANCES.find((d) => d.radiusMeters > radius);
        if (nextTier && !hasWidened) {
          await runSearch(nextTier.radiusMeters, true);
          return;
        }
        setWidened(hasWidened);
        setPool([]);
        setPicks([]);
        setPhase("empty");
        return;
      }

      const { picks: firstPicks } = pickThree(scored, new Set());
      setPool(scored);
      setPicks(firstPicks);
      setShownIds(new Set(firstPicks.map((p) => p.id)));
      setWidened(hasWidened);
      setPhase("results");
    } catch (err) {
      setErrorMessage(
        err instanceof OverpassError
          ? "Mekan verisine şu an ulaşamıyoruz. Birkaç saniye sonra tekrar dene."
          : "Beklenmedik bir hata oluştu.",
      );
      setPhase("error");
    }
  }

  function handleReroll() {
    const { picks: nextPicks, exhausted } = pickThree(pool, shownIds);
    setPicks(nextPicks);
    setShownIds(exhausted ? new Set(nextPicks.map((p) => p.id)) : new Set([...shownIds, ...nextPicks.map((p) => p.id)]));
  }

  function handleBackToForm() {
    setPhase("form");
  }

  const canSearch = Boolean(coords);

  return (
    <div className="mx-auto min-h-screen max-w-md px-5 pb-16 pt-10">
      <header className="mb-8 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-coral-500 text-white shadow-pop">
          <UtensilsCrossed className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">Ne Yesem?</h1>
          <p className="text-xs text-ink-soft">Karar senin yerine, saniyeler içinde.</p>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {phase === "form" && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-7"
          >
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-ink-soft">Neredesin?</h2>
              <LocationControl coords={coords} onLocated={setCoords} />
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-ink-soft">Ne canın çekiyor?</h2>
              <CuisineChips
                selected={cuisineKeys}
                onToggle={(key) => setCuisineKeys((prev) => toggleCuisineSelection(prev, key))}
              />
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-ink-soft">Nerede yemek istersin?</h2>
              <SegmentedControl
                layoutId="place-type"
                options={PLACE_TYPE_OPTIONS}
                value={placeType}
                onChange={setPlaceType}
              />
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-ink-soft">Ne kadar uzaklaşabilirsin?</h2>
              <SegmentedControl
                layoutId="distance"
                options={DISTANCES.map((d) => ({ key: d.key, label: d.label, helper: d.helper }))}
                value={distance}
                onChange={setDistance}
              />
            </section>

            <PrimaryButton
              className="w-full"
              disabled={!canSearch}
              onClick={() => runSearch()}
            >
              Bana 3 Öneri Sun
            </PrimaryButton>
            {!canSearch && (
              <p className="text-center text-xs text-ink-soft">
                Öneri alabilmek için önce konumunu paylaş.
              </p>
            )}
          </motion.div>
        )}

        {phase === "searching" && (
          <motion.div key="searching" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LoadingState />
          </motion.div>
        )}

        {phase === "error" && (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ErrorState message={errorMessage} onRetry={() => runSearch()} />
            <button
              onClick={handleBackToForm}
              className="mx-auto mt-4 block text-xs font-semibold text-ink-soft underline underline-offset-2"
            >
              Filtrelere dön
            </button>
          </motion.div>
        )}

        {phase === "empty" && (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <EmptyState widened={widened} onRetry={() => runSearch()} onBack={handleBackToForm} />
          </motion.div>
        )}

        {phase === "results" && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-semibold text-ink">İşte sana 3 öneri</h2>
                {widened && (
                  <p className="text-xs text-ink-soft">Yakınında bulamadık, aramayı genişlettik.</p>
                )}
              </div>
              <button
                onClick={handleBackToForm}
                className="flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink-soft hover:border-coral-300 hover:text-coral-600"
              >
                <Settings2 className="h-3.5 w-3.5" />
                Filtreler
              </button>
            </div>

            <div className="space-y-4">
              {picks.map((place, i) => (
                <ResultCard key={place.id} place={place} index={i} />
              ))}
            </div>

            <PrimaryButton variant="ghost" className="w-full" onClick={handleReroll}>
              <RefreshCw className="h-4 w-4" />
              Başka Öneriler Göster
            </PrimaryButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

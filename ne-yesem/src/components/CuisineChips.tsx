import { CUISINES } from "../data/options";

interface CuisineChipsProps {
  selected: string[];
  onToggle: (key: string) => void;
}

export function CuisineChips({ selected, onToggle }: CuisineChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {CUISINES.map((cuisine) => {
        const active = selected.includes(cuisine.key);
        return (
          <button
            key={cuisine.key}
            type="button"
            onClick={() => onToggle(cuisine.key)}
            className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition ${
              active
                ? "border-coral-500 bg-coral-50 text-coral-700"
                : "border-line bg-white text-ink-soft hover:border-coral-300 hover:text-ink"
            }`}
          >
            <span aria-hidden>{cuisine.emoji}</span>
            {cuisine.label}
          </button>
        );
      })}
    </div>
  );
}

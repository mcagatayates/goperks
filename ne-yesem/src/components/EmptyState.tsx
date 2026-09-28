import { SearchX } from "lucide-react";
import { PrimaryButton } from "./PrimaryButton";

interface EmptyStateProps {
  onRetry: () => void;
  onBack: () => void;
  widened: boolean;
}

export function EmptyState({ onRetry, onBack, widened }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-line bg-white/60 px-6 py-14 text-center">
      <SearchX className="h-10 w-10 text-ink-soft" />
      <div className="space-y-1">
        <p className="font-display text-lg font-semibold text-ink">Civarda uygun bir yer bulamadık</p>
        <p className="text-sm text-ink-soft">
          {widened
            ? "Mesafeyi genişletmeyi denedik ama yine de yer bulamadık. Filtreleri değiştirmeyi dene."
            : "Mesafeyi veya mutfak seçimini biraz gevşetmeyi dene."}
        </p>
      </div>
      <div className="flex gap-2">
        <PrimaryButton variant="ghost" onClick={onBack}>
          Filtreleri Değiştir
        </PrimaryButton>
        <PrimaryButton onClick={onRetry}>Tekrar Dene</PrimaryButton>
      </div>
    </div>
  );
}

import { WifiOff } from "lucide-react";
import { PrimaryButton } from "./PrimaryButton";

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-line bg-white/60 px-6 py-14 text-center">
      <WifiOff className="h-10 w-10 text-ink-soft" />
      <div className="space-y-1">
        <p className="font-display text-lg font-semibold text-ink">Bir şeyler ters gitti</p>
        <p className="text-sm text-ink-soft">{message}</p>
      </div>
      <PrimaryButton onClick={onRetry}>Tekrar Dene</PrimaryButton>
    </div>
  );
}

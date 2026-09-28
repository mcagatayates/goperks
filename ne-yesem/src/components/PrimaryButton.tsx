import type { ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: "solid" | "ghost";
}

export function PrimaryButton({
  loading,
  variant = "solid",
  className = "",
  children,
  disabled,
  ...rest
}: PrimaryButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[15px] font-semibold transition active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none";
  const styles =
    variant === "solid"
      ? "bg-coral-500 text-white shadow-pop hover:bg-coral-600"
      : "bg-white text-ink border border-line hover:border-coral-300 hover:text-coral-600";

  return (
    <button className={`${base} ${styles} ${className}`} disabled={disabled || loading} {...rest}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

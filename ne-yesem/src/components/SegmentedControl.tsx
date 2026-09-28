import { motion } from "framer-motion";

interface Option<T extends string> {
  key: T;
  label: string;
  helper?: string;
}

interface SegmentedControlProps<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (key: T) => void;
  layoutId: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  layoutId,
}: SegmentedControlProps<T>) {
  return (
    <div className="grid grid-flow-col auto-cols-fr gap-1 rounded-2xl bg-cream-100 p-1">
      {options.map((option) => {
        const active = option.key === value;
        return (
          <button
            key={option.key}
            type="button"
            onClick={() => onChange(option.key)}
            className={`relative rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
              active ? "text-white" : "text-ink-soft hover:text-ink"
            }`}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-xl bg-coral-500 shadow-sm"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative flex flex-col items-center leading-tight">
              {option.label}
              {option.helper && (
                <span className={`text-[11px] font-normal ${active ? "text-white/80" : "text-ink-soft/70"}`}>
                  {option.helper}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

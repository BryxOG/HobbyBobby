"use client";

import { cn } from "@/lib/cn";

interface Props<T extends string> {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  label: string;
}

/** iOS segmented control — the "Организую / Участвую" tabs on Мои события. */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: Props<T>) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="flex gap-1 rounded-xl bg-surface p-1"
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            role="tab"
            type="button"
            aria-selected={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex-1 rounded-lg py-1.5 text-[14px] font-semibold transition-colors",
              selected ? "bg-bg text-fg shadow-sm" : "text-fg-muted",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

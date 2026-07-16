"use client";

import { cn } from "@/lib/cn";

interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}

/** iOS-style switch — used by Настройки (Уведомления / Геолокация). */
export function Toggle({ checked, onChange, label, disabled }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-200",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        "disabled:opacity-40",
        checked ? "bg-success" : "bg-border dark:bg-elevated",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute top-[2px] left-[2px] size-[27px] rounded-full bg-white shadow-sm",
          "transition-transform duration-200",
          checked && "translate-x-5",
        )}
      />
    </button>
  );
}

"use client";

import { cn } from "@/lib/cn";
import { ru } from "@/lib/i18n/ru";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/** The "Поиск" field that sits at the top of the sketch's list screens. */
export function SearchField({ value, onChange, placeholder, className }: Props) {
  return (
    <div className={cn("relative", className)}>
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-muted"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? ru.common.search}
        aria-label={placeholder ?? ru.common.search}
        className={cn(
          "h-9 w-full rounded-xl bg-surface pr-3 pl-9 text-[16px] text-fg",
          "placeholder:text-fg-muted",
          "focus:ring-2 focus:ring-primary focus:outline-none",
          "[&::-webkit-search-cancel-button]:appearance-none",
        )}
      />
    </div>
  );
}

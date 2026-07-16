"use client";

import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

interface Props {
  selected?: boolean;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
}

/** Filter/tag pill — Интересы chips and the map's "Виды активности" filter. */
export function Chip({ selected, onClick, children, className, ...rest }: Props) {
  const Tag = onClick ? "button" : "span";
  return (
    <Tag
      {...rest}
      {...(onClick ? { type: "button" as const, onClick, "aria-pressed": selected } : {})}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[14px] font-medium whitespace-nowrap",
        "transition-colors duration-100",
        onClick && "active:scale-[0.97]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        selected
          ? "bg-primary text-primary-fg"
          : "bg-surface text-fg-muted ring-1 ring-border ring-inset",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

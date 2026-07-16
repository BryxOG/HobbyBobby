"use client";

import { cn } from "@/lib/cn";
import Link from "next/link";
import type { ReactNode } from "react";

/** Grouped inset list — the iOS Settings pattern the sketch's menus use. */
export function ListGroup({
  children,
  className,
  title,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <section className={className}>
      {title && (
        <h2 className="px-4 pb-2 text-[13px] font-medium tracking-wide text-fg-muted uppercase">
          {title}
        </h2>
      )}
      <div className="divide-y divide-border overflow-hidden rounded-card bg-surface">
        {children}
      </div>
    </section>
  );
}

interface RowProps {
  icon?: ReactNode;
  label: ReactNode;
  hint?: ReactNode;
  value?: ReactNode;
  trailing?: ReactNode;
  href?: string;
  onClick?: () => void;
  danger?: boolean;
}

export function ListRow({
  icon,
  label,
  hint,
  value,
  trailing,
  href,
  onClick,
  danger,
}: RowProps) {
  const interactive = Boolean(href || onClick);

  const body = (
    <>
      {icon && (
        <span aria-hidden className="grid size-7 shrink-0 place-items-center text-[20px]">
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block truncate text-[16px]",
            danger ? "text-danger" : "text-fg",
          )}
        >
          {label}
        </span>
        {hint && (
          <span className="mt-0.5 block text-[13px] leading-snug text-fg-muted">
            {hint}
          </span>
        )}
      </span>
      {value != null && (
        <span className="shrink-0 text-[15px] text-fg-muted">{value}</span>
      )}
      {trailing}
      {interactive && !trailing && <Chevron />}
    </>
  );

  const classes = cn(
    "flex w-full items-center gap-3 px-4 py-3 text-left",
    interactive && "active:bg-elevated transition-colors",
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {body}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={classes}>
        {body}
      </button>
    );
  }
  return <div className={classes}>{body}</div>;
}

function Chevron() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-4 shrink-0 text-fg-muted"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

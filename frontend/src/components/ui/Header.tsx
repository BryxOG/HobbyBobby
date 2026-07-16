"use client";

import { cn } from "@/lib/cn";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { ru } from "@/lib/i18n/ru";

interface Props {
  title: ReactNode;
  back?: boolean | string;
  trailing?: ReactNode;
  large?: boolean;
  className?: string;
}

/**
 * Sticky nav bar. `back` is a string href when a step must return somewhere
 * specific (wizard steps), or `true` to pop history.
 */
export function Header({ title, back, trailing, large, className }: Props) {
  const router = useRouter();

  return (
    <header
      className={cn(
        "sticky top-0 z-30 bg-bg/80 backdrop-blur-xl",
        "border-b border-border",
        "pt-[env(safe-area-inset-top)]",
        className,
      )}
    >
      <div className="flex h-11 items-center gap-1 px-2">
        <div className="flex min-w-0 flex-1 items-center">
          {back && (
            <button
              type="button"
              onClick={() =>
                typeof back === "string" ? router.push(back) : router.back()
              }
              aria-label={ru.common.back}
              className="-ml-1 flex items-center gap-0.5 rounded-lg px-1 py-1 text-primary active:opacity-60"
            >
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                className="size-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
              <span className="text-[16px]">{ru.common.back}</span>
            </button>
          )}
          {!large && (
            <h1 className="truncate px-2 text-[17px] font-semibold">{title}</h1>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">{trailing}</div>
      </div>

      {large && (
        <h1 className="truncate px-4 pt-1 pb-2 text-[32px] leading-tight font-bold tracking-tight">
          {title}
        </h1>
      )}
    </header>
  );
}

"use client";

import { cn } from "@/lib/cn";
import { ru } from "@/lib/i18n/ru";
import { Button } from "./Button";

export function EmptyState({
  emoji = "🔍",
  title,
  hint,
  action,
}: {
  emoji?: string;
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-8 py-16 text-center">
      <span aria-hidden className="text-[44px]">
        {emoji}
      </span>
      <p className="text-[17px] font-semibold">{title}</p>
      {hint && <p className="text-[14px] text-balance text-fg-muted">{hint}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      emoji="⚠️"
      title={ru.common.error}
      action={
        onRetry && (
          <Button variant="secondary" onClick={onRetry}>
            {ru.common.retry}
          </Button>
        )
      }
    />
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-lg bg-elevated", className)}
    />
  );
}

export function EventCardSkeleton() {
  return (
    <div className="flex gap-3 rounded-card bg-surface p-3">
      <Skeleton className="size-11 shrink-0 rounded-xl" />
      <div className="flex-1 space-y-2 py-0.5">
        <Skeleton className="h-4 w-2/5" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/5" />
      </div>
    </div>
  );
}

export function EventListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-2" aria-label={ru.common.loading} aria-busy>
      {Array.from({ length: count }, (_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  );
}

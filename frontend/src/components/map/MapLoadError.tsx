"use client";

import { ru } from "@/lib/i18n/ru";
import { Button } from "@/components/ui/Button";

interface Props {
  error: string;
  compact?: boolean;
  onRetry?: () => void;
}

/**
 * Сообщение об ошибке загрузки Яндекс Карт с кнопкой повтора.
 */
export function MapLoadError({ error, compact, onRetry }: Props) {
  const hint = error.includes("NEXT_PUBLIC_YANDEX_MAPS_API_KEY")
    ? ru.map.noApiKey
    : error;

  return (
    <div
      className={
        compact
          ? "grid h-56 w-full place-items-center rounded-card bg-surface p-4 text-center"
          : "grid size-full place-items-center bg-surface p-4 text-center"
      }
    >
      <div className="space-y-2">
        <p className={compact ? "text-[14px] font-semibold" : "text-[15px] font-semibold"}>
          {ru.map.loadError}
        </p>
        <p className={compact ? "text-[12px] text-fg-muted" : "text-[13px] text-fg-muted"}>
          {hint}
        </p>
        {onRetry && (
          <Button type="button" size="sm" variant="secondary" onClick={onRetry}>
            {ru.common.retry}
          </Button>
        )}
      </div>
    </div>
  );
}

"use client";

import { getActivity } from "@/lib/activities";
import type { ActivityId } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { ru } from "@/lib/i18n/ru";

const SIZES = {
  sm: "size-8 text-[16px] rounded-lg",
  md: "size-11 text-[22px] rounded-xl",
  lg: "size-14 text-[28px] rounded-2xl",
};

export function ActivityIcon({
  id,
  size = "md",
  className,
}: {
  id: ActivityId;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <span
      role="img"
      aria-label={ru.activities[id]}
      className={cn(
        "grid shrink-0 place-items-center bg-elevated select-none",
        SIZES[size],
        className,
      )}
    >
      {getActivity(id).emoji}
    </span>
  );
}

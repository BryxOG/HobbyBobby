"use client";

import { ACTIVITY_CATEGORIES, activitiesByCategory } from "@/lib/activities";
import type { ActivityId } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { ru } from "@/lib/i18n/ru";

interface Props {
  selected: ActivityId[];
  onSelect: (id: ActivityId) => void;
  /** Single = create wizard's "Выберите тип"; multi = "Интересы". */
  mode?: "single" | "multi";
}

/** The 5-per-row emoji grid from the sketch, grouped Спорт / Хобби / Встречи. */
export function ActivityGrid({ selected, onSelect, mode = "single" }: Props) {
  return (
    <div className="space-y-6">
      {ACTIVITY_CATEGORIES.map((category) => (
        <section key={category}>
          <h2 className="px-1 pb-3 text-[13px] font-medium tracking-wide text-fg-muted uppercase">
            {ru.categories[category]}
          </h2>
          <ul className="grid grid-cols-5 gap-2">
            {activitiesByCategory(category).map((activity) => {
              const isSelected = selected.includes(activity.id);
              return (
                <li key={activity.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(activity.id)}
                    aria-pressed={mode === "multi" ? isSelected : undefined}
                    aria-label={ru.activities[activity.id]}
                    className={cn(
                      "flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-2xl p-1",
                      "transition-[transform,background-color] duration-100 active:scale-95",
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                      isSelected
                        ? "bg-primary text-primary-fg"
                        : "bg-surface text-fg-muted",
                    )}
                  >
                    <span aria-hidden className="text-[26px] leading-none">
                      {activity.emoji}
                    </span>
                    <span className="w-full truncate px-0.5 text-center text-[9px] leading-tight font-medium">
                      {ru.activities[activity.id]}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

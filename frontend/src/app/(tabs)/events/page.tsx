"use client";

import { useMemo, useState } from "react";
import { ACTIVITIES } from "@/lib/activities";
import { useEvents } from "@/lib/api/hooks";
import type { ActivityId } from "@/lib/api/types";
import { ru } from "@/lib/i18n/ru";
import { useDebounced } from "@/lib/useDebounced";
import { EventCard } from "@/components/events/EventCard";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Header } from "@/components/ui/Header";
import { SearchField } from "@/components/ui/SearchField";
import {
  EmptyState,
  ErrorState,
  EventListSkeleton,
} from "@/components/ui/States";

export default function EventsPage() {
  const [search, setSearch] = useState("");
  const [activities, setActivities] = useState<ActivityId[]>([]);
  const query = useDebounced(search);

  const filters = useMemo(
    () => ({ query, activityIds: activities }),
    [query, activities],
  );

  const {
    data,
    isPending,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useEvents(filters);

  const events = data?.pages.flatMap((p) => p.items) ?? [];

  function toggle(id: ActivityId) {
    setActivities((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
    );
  }

  return (
    <>
      <Header title={ru.events.title} large />

      <div className="space-y-3 px-4 pt-3">
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder={ru.events.searchPlaceholder}
        />

        {/* Bleed to the screen edges so the row reads as scrollable. */}
        <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max gap-2 pb-1">
            <Chip
              selected={activities.length === 0}
              onClick={() => setActivities([])}
            >
              {ru.map.filterAll}
            </Chip>
            {ACTIVITIES.map((activity) => (
              <Chip
                key={activity.id}
                selected={activities.includes(activity.id)}
                onClick={() => toggle(activity.id)}
              >
                <span aria-hidden>{activity.emoji}</span>
                {ru.activities[activity.id]}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1 space-y-2 px-4 py-3">
        {isPending && <EventListSkeleton />}
        {isError && <ErrorState onRetry={() => refetch()} />}

        {!isPending && !isError && events.length === 0 && (
          <EmptyState title={ru.events.empty} hint={ru.events.emptyHint} />
        )}

        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}

        {hasNextPage && (
          <div className="pt-2 pb-1">
            <Button
              variant="secondary"
              fullWidth
              loading={isFetchingNextPage}
              onClick={() => fetchNextPage()}
            >
              {ru.events.loadMore}
            </Button>
          </div>
        )}
      </main>
    </>
  );
}

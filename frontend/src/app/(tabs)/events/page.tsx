"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ACTIVITIES } from "@/lib/activities";
import {
  toEventListQuery,
  useEvents,
  useMyEventsFeed,
  useParseSearch,
} from "@/lib/api/hooks";
import { USING_MOCKS } from "@/lib/api/client";
import type { ActivityId } from "@/lib/api/types";
import { ru } from "@/lib/i18n/ru";
import { useAuth } from "@/lib/stores/auth";
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

type FeedMode = "all" | "mine";

export default function EventsPage() {
  const router = useRouter();
  const userId = useAuth((s) => s.userId);
  const isLoggedIn = USING_MOCKS || Boolean(userId);

  const [feedMode, setFeedMode] = useState<FeedMode>("all");
  const [search, setSearch] = useState("");
  const [activities, setActivities] = useState<ActivityId[]>([]);
  const query = useDebounced(search);

  const { data: intent } = useParseSearch(query, query.trim().length >= 2);

  const filters = useMemo(
    () => toEventListQuery(activities, query),
    [activities, query],
  );

  const interpretationChips = useMemo(() => {
    if (!intent?.interpretedAs) return [];
    return [intent.interpretedAs.when, intent.interpretedAs.what, intent.interpretedAs.where]
      .filter((label): label is string => Boolean(label && label.trim()));
  }, [intent]);

  const allEvents = useEvents(filters, feedMode === "all");
  const myEvents = useMyEventsFeed(filters, feedMode === "mine");
  const {
    data,
    isPending,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = feedMode === "all" ? allEvents : myEvents;

  const events = data?.pages.flatMap((p) => p.items) ?? [];

  function selectMine() {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    setFeedMode("mine");
  }

  function selectAll() {
    setFeedMode("all");
    setActivities([]);
  }

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

        {interpretationChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-[var(--muted)]">{ru.events.interpreted}</span>
            {interpretationChips.map((label) => (
              <Chip key={label} selected>
                {label}
              </Chip>
            ))}
          </div>
        )}

        {/* Bleed to the screen edges so the row reads as scrollable. */}
        <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max gap-2 pb-1">
            <Chip selected={feedMode === "mine"} onClick={selectMine}>
              {ru.events.myEvents}
            </Chip>
            <Chip
              selected={feedMode === "all" && activities.length === 0}
              onClick={selectAll}
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
          <EmptyState
            title={
              feedMode === "mine" ? ru.events.emptyMine : ru.events.empty
            }
            hint={
              feedMode === "mine"
                ? ru.events.emptyMineHint
                : ru.events.emptyHint
            }
          />
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

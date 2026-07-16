"use client";

import { useState } from "react";
import { useMyEvents } from "@/lib/api/hooks";
import type { MyEventsScope } from "@/lib/api/types";
import { ru } from "@/lib/i18n/ru";
import { EventCard } from "@/components/events/EventCard";
import { Button } from "@/components/ui/Button";
import { Header } from "@/components/ui/Header";
import { Segmented } from "@/components/ui/Segmented";
import {
  EmptyState,
  ErrorState,
  EventListSkeleton,
} from "@/components/ui/States";

export default function MyEventsPage() {
  const [scope, setScope] = useState<MyEventsScope>("organizing");
  const {
    data,
    isPending,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMyEvents(scope);

  const events = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <>
      <Header title={ru.myEvents.title} back="/menu" />

      <div className="px-4 pt-3">
        <Segmented
          label={ru.myEvents.title}
          value={scope}
          onChange={setScope}
          options={[
            { value: "organizing", label: ru.myEvents.organizing },
            { value: "participating", label: ru.myEvents.participating },
          ]}
        />
      </div>

      <main className="flex-1 space-y-2 px-4 py-3">
        {isPending && <EventListSkeleton />}
        {isError && <ErrorState onRetry={() => refetch()} />}

        {!isPending && !isError && events.length === 0 && (
          <EmptyState
            emoji={scope === "organizing" ? "🎉" : "🙋"}
            title={
              scope === "organizing"
                ? ru.myEvents.emptyOrganizing
                : ru.myEvents.emptyParticipating
            }
          />
        )}

        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}

        {hasNextPage && (
          <Button
            variant="secondary"
            fullWidth
            loading={isFetchingNextPage}
            onClick={() => fetchNextPage()}
          >
            {ru.events.loadMore}
          </Button>
        )}
      </main>
    </>
  );
}

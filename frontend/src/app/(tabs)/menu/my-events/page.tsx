"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMyEvents } from "@/lib/api/hooks";
import { USING_MOCKS } from "@/lib/api/client";
import type { MyEventsScope } from "@/lib/api/types";
import { ru } from "@/lib/i18n/ru";
import { useAuth } from "@/lib/stores/auth";
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
  const router = useRouter();
  const userId = useAuth((s) => s.userId);
  const isLoggedIn = USING_MOCKS || Boolean(userId);

  const [scope, setScope] = useState<MyEventsScope>("organizing");

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace("/login");
    }
  }, [isLoggedIn, router]);
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

  if (!isLoggedIn) {
    return <Header title={ru.myEvents.title} back="/menu" />;
  }

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

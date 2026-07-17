"use client";

import Link from "next/link";
import { use } from "react";
import { useCancelEvent, useEvent } from "@/lib/api/hooks";
import { useSyncChatMembership } from "@/lib/api/hooks/useSyncChatMembership";
import { formatEventRange } from "@/lib/format";
import { ru } from "@/lib/i18n/ru";
import { useAuth } from "@/lib/stores/auth";
import { ActivityIcon } from "@/components/events/ActivityIcon";
import { JoinButton } from "@/components/events/JoinButton";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Header } from "@/components/ui/Header";
import { ErrorState, Skeleton } from "@/components/ui/States";

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const userId = useAuth((s) => s.userId);
  const { data: event, isPending, isError, refetch } = useEvent(id);
  const cancelEvent = useCancelEvent();
  useSyncChatMembership(id, event?.isJoined);

  if (isError) {
    return (
      <>
        <Header title="" back />
        <ErrorState onRetry={() => refetch()} />
      </>
    );
  }

  if (isPending) {
    return (
      <>
        <Header title="" back />
        <div className="space-y-4 p-4">
          <Skeleton className="h-14 w-14 rounded-2xl" />
          <Skeleton className="h-7 w-3/5" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </>
    );
  }

  const taken = event.participants.length;
  const isOrganizer = userId != null && event.organizer.id === userId;
  const isCancelled = event.status === "CANCELLED";

  return (
    <>
      <Header title={event.title} back />

      <main className="flex-1 space-y-6 px-4 py-4 pb-28">
        {isCancelled && (
          <section className="rounded-card border border-danger/30 bg-danger/10 px-4 py-3">
            <p className="text-[15px] font-semibold text-danger">{ru.events.cancelled}</p>
            <p className="text-[13px] text-fg-muted">{ru.events.cancelledHint}</p>
          </section>
        )}

        <section className="flex items-start gap-3">
          <ActivityIcon id={event.activityId} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-fg-muted">
              {ru.activities[event.activityId]}
            </p>
            <h1 className="text-[24px] leading-tight font-bold tracking-tight">
              {event.title}
            </h1>
          </div>
        </section>

        {event.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {event.tags.map((tag) => (
              <Chip key={tag.id}>{tag.label}</Chip>
            ))}
          </div>
        )}

        <section className="space-y-1">
          <h2 className="text-[13px] font-medium tracking-wide text-fg-muted uppercase">
            {ru.events.description}
          </h2>
          <p className="text-[15px] leading-relaxed whitespace-pre-line">
            {event.description}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-[13px] font-medium tracking-wide text-fg-muted uppercase">
            {ru.events.dateTime}
          </h2>
          <p className="text-[15px]">
            {formatEventRange(event.startsAt, event.endsAt)}
          </p>
          <p className="text-[15px] text-fg-muted">📍 {event.location.address}</p>
        </section>

        <section className="rounded-card bg-surface p-3">
          <h2 className="pb-2 text-[13px] font-medium tracking-wide text-fg-muted uppercase">
            {ru.events.createdBy}
          </h2>
          <div className="flex items-center gap-3">
            <Avatar user={event.organizer} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[17px] font-semibold">
                {event.organizer.name}
              </p>
              <p className="text-[13px] text-fg-muted">
                {event.organizer.level} {ru.profile.level}
                {event.organizer.rating != null &&
                  ` · ${event.organizer.rating}/5⭐`}
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[13px] font-medium tracking-wide text-fg-muted uppercase">
              {ru.events.participantsList}
            </h2>
            <span className="text-[15px] font-semibold tabular-nums">
              {ru.events.participants}: {taken}/{event.capacity}
            </span>
          </div>
          <ul className="divide-y divide-border overflow-hidden rounded-card bg-surface">
            {event.participants.map((person) => (
              <li key={person.id} className="flex items-center gap-3 px-3 py-2.5">
                <Avatar user={person} />
                <span className="min-w-0 flex-1 truncate text-[16px]">
                  {person.name}
                </span>
                <span className="text-[13px] text-fg-muted">
                  {person.level} {ru.profile.level}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {isOrganizer && !isCancelled && (
          <Button
            variant="danger"
            fullWidth
            loading={cancelEvent.isPending}
            onClick={() => cancelEvent.mutate(event.id)}
          >
            {ru.events.cancelEvent}
          </Button>
        )}

        {event.isJoined && !isCancelled && (
          <Link
            href={`/chats/${event.id}`}
            className="flex items-center justify-center gap-2 rounded-card bg-surface py-3 text-[15px] font-semibold text-primary active:bg-elevated"
          >
            💬 {ru.events.openChat}
          </Link>
        )}
      </main>

      {!isCancelled && (
        <div className="sticky bottom-0 border-t border-border bg-bg/85 px-4 py-3 backdrop-blur-xl">
          <JoinButton event={event} size="lg" fullWidth />
        </div>
      )}
    </>
  );
}

"use client";

import Link from "next/link";
import type { EventItem } from "@/lib/api/types";
import { formatEventRange } from "@/lib/format";
import { ru } from "@/lib/i18n/ru";
import { ActivityIcon } from "./ActivityIcon";
import { JoinButton } from "./JoinButton";

/**
 * List/feed card from the sketch: type icon, title, participant counter,
 * description, date/time, organizer, and the join toggle.
 *
 * The whole card is a link via an overlay pseudo-element, which keeps the
 * JoinButton clickable without nesting a button inside an anchor.
 */
export function EventCard({ event }: { event: EventItem }) {
  const taken = event.participants.length;

  return (
    <article className="relative flex gap-3 rounded-card bg-surface p-3 transition-colors has-[a:active]:bg-elevated">
      <ActivityIcon id={event.activityId} />

      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <h3 className="min-w-0 flex-1 truncate text-[16px] font-semibold">
            <Link
              href={`/events/${event.id}`}
              className="after:absolute after:inset-0 after:content-['']"
            >
              {event.title}
            </Link>
          </h3>
          <span className="shrink-0 text-[13px] font-medium tabular-nums text-fg-muted">
            {taken}/{event.capacity}
          </span>
        </div>

        <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-fg-muted">
          {event.description}
        </p>

        <p className="mt-1.5 text-[13px] text-fg-muted">
          {formatEventRange(event.startsAt, event.endsAt)}
        </p>

        <div className="mt-2 flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[12px] text-fg-muted">
              {ru.events.createdBy}: {event.organizer.name}
            </p>
            {event.rating != null && (
              <p className="text-[12px] text-fg-muted">{event.rating}/5⭐</p>
            )}
          </div>
          {/* z-10 lifts the control above the card-wide link overlay. */}
          <div className="relative z-10 shrink-0">
            <JoinButton event={event} />
          </div>
        </div>
      </div>
    </article>
  );
}

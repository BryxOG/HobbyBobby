"use client";

import Link from "next/link";
import { useChats } from "@/lib/api/hooks";
import { formatRelative } from "@/lib/format";
import { ru } from "@/lib/i18n/ru";
import { ActivityIcon } from "@/components/events/ActivityIcon";
import { Header } from "@/components/ui/Header";
import { EmptyState, ErrorState, EventListSkeleton } from "@/components/ui/States";

export default function ChatsPage() {
  const { data: chats, isPending, isError, refetch } = useChats();

  return (
    <>
      <Header title={ru.chats.title} large />

      <main className="flex-1 px-4 py-3">
        {isPending && <EventListSkeleton count={5} />}
        {isError && <ErrorState onRetry={() => refetch()} />}

        {chats?.length === 0 && (
          <EmptyState
            emoji="💬"
            title={ru.chats.empty}
            hint={ru.chats.emptyHint}
          />
        )}

        {chats && chats.length > 0 && (
          <ul className="divide-y divide-border overflow-hidden rounded-card bg-surface">
            {chats.map((chat) => (
              <li key={chat.eventId}>
                <Link
                  href={`/chats/${chat.eventId}`}
                  className="flex items-center gap-3 px-3 py-3 active:bg-elevated"
                >
                  <ActivityIcon id={chat.activityId} />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <h2 className="min-w-0 flex-1 truncate text-[16px] font-semibold">
                        {chat.title}
                      </h2>
                      {chat.lastMessage && (
                        <time
                          dateTime={chat.lastMessage.sentAt}
                          className="shrink-0 text-[12px] text-fg-muted"
                        >
                          {formatRelative(chat.lastMessage.sentAt)}
                        </time>
                      )}
                    </div>

                    <p className="truncate text-[12px] text-fg-muted">
                      {ru.events.createdBy}: {chat.organizer.name}
                    </p>

                    <p className="mt-0.5 truncate text-[13px] text-fg-muted">
                      {chat.lastMessage
                        ? `${chat.lastMessage.isOwn ? `${ru.chats.you}: ` : ""}${chat.lastMessage.text}`
                        : ru.chats.noMessages}
                    </p>
                  </div>

                  {chat.unreadCount > 0 && (
                    <span
                      aria-label={`${chat.unreadCount}`}
                      className="grid size-5 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-semibold text-primary-fg tabular-nums"
                    >
                      {chat.unreadCount}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}

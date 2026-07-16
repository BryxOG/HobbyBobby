"use client";

import Link from "next/link";
import { use, useEffect, useRef, useState } from "react";
import { useEvent, useMessages, useSendMessage } from "@/lib/api/hooks";
import { cn } from "@/lib/cn";
import { formatTime } from "@/lib/format";
import { ru } from "@/lib/i18n/ru";
import { Avatar } from "@/components/ui/Avatar";
import { Header } from "@/components/ui/Header";
import { EmptyState, Skeleton } from "@/components/ui/States";

export default function ChatRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: event } = useEvent(id);
  const { data: messages, isPending } = useMessages(id);
  const send = useSendMessage(id);

  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Pin to the newest message the way a chat is expected to behave.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages?.length]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = text.trim();
    if (!value || send.isPending) return;
    setText("");
    send.mutate(value);
  }

  return (
    <>
      <Header
        title={event?.title ?? ""}
        back="/chats"
        trailing={
          event && (
            <Link
              href={`/events/${event.id}`}
              className="px-2 text-[15px] text-primary active:opacity-60"
            >
              {ru.events.title}
            </Link>
          )
        }
      />

      <main className="flex-1 space-y-2 px-4 py-3">
        {isPending && (
          <div className="space-y-3">
            <Skeleton className="h-10 w-3/5 rounded-2xl" />
            <Skeleton className="ml-auto h-10 w-2/5 rounded-2xl" />
            <Skeleton className="h-10 w-1/2 rounded-2xl" />
          </div>
        )}

        {messages?.length === 0 && (
          <EmptyState
            emoji="👋"
            title={ru.chats.noMessages}
            hint={ru.chats.startHint}
          />
        )}

        {messages?.map((message, i) => {
          // Only label a message with its author when the speaker changes.
          const prev = messages[i - 1];
          const showAuthor = !message.isOwn && prev?.author.id !== message.author.id;

          return (
            <div
              key={message.id}
              className={cn(
                "flex items-end gap-2",
                message.isOwn ? "justify-end" : "justify-start",
              )}
            >
              {!message.isOwn && (
                <span className="w-7 shrink-0">
                  {showAuthor && <Avatar user={message.author} size="sm" />}
                </span>
              )}

              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-3 py-2",
                  message.isOwn
                    ? "rounded-br-md bg-bubble-out text-white"
                    : "rounded-bl-md bg-bubble-in text-fg",
                )}
              >
                {showAuthor && (
                  <p className="mb-0.5 text-[12px] font-semibold opacity-70">
                    {message.author.name}
                  </p>
                )}
                <p className="text-[15px] leading-snug break-words">
                  {message.text}
                </p>
                <time
                  dateTime={message.sentAt}
                  className="mt-0.5 block text-right text-[10px] opacity-60"
                >
                  {formatTime(message.sentAt)}
                </time>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </main>

      <form
        onSubmit={submit}
        className="sticky bottom-0 flex items-center gap-2 border-t border-border bg-bg/85 px-3 py-2 backdrop-blur-xl"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={ru.chats.placeholder}
          aria-label={ru.chats.placeholder}
          className="h-10 flex-1 rounded-full bg-surface px-4 text-[16px] placeholder:text-fg-muted focus:ring-2 focus:ring-primary focus:outline-none"
        />
        <button
          type="submit"
          disabled={!text.trim() || send.isPending}
          aria-label={ru.chats.send}
          className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-fg transition-transform active:scale-90 disabled:opacity-40"
        >
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="size-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
      </form>
    </>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useCreateEvent, usePublishQuote } from "@/lib/api/hooks";
import { formatEventRange } from "@/lib/format";
import { ru } from "@/lib/i18n/ru";
import { useDraft } from "@/lib/stores/draft";
import { ActivityIcon } from "@/components/events/ActivityIcon";
import { Button } from "@/components/ui/Button";
import { Header } from "@/components/ui/Header";
import { Skeleton } from "@/components/ui/States";

/**
 * Step 3 of 4 — "Публикация". Shows the one-off fee from the sketch (50 ₽).
 * The amount comes from the server quote, never a hardcoded constant, since the
 * price and provider are still open questions in the spec.
 */
export default function PublishPage() {
  const router = useRouter();
  const draft = useDraft();
  const { data: quote } = usePublishQuote();
  const create = useCreateEvent();

  useEffect(() => {
    if (!draft.activityId || !draft.title) router.replace("/create");
  }, [draft.activityId, draft.title, router]);

  if (!draft.activityId || !draft.location) return null;

  function publish() {
    if (!draft.activityId || !draft.location) return;

    create.mutate(
      {
        title: draft.title.trim(),
        activityId: draft.activityId,
        description: draft.description.trim(),
        // The wizard holds local datetime strings; the contract wants ISO.
        startsAt: new Date(draft.startsAt).toISOString(),
        endsAt: new Date(draft.endsAt).toISOString(),
        location: draft.location,
        capacity: draft.capacity,
        tagIds: draft.tagIds,
      },
      {
        onSuccess: (event) => {
          draft.patch({ publishedId: event.id });
          router.push("/create/done");
        },
      },
    );
  }

  const amount = quote ? `${quote.amount} ₽` : null;

  return (
    <>
      <Header title={ru.create.publish} back="/create/details" />

      <main className="flex-1 space-y-6 px-4 py-4">
        <section className="space-y-2">
          <h2 className="px-1 text-[13px] font-medium tracking-wide text-fg-muted uppercase">
            {ru.create.summary}
          </h2>
          <div className="space-y-3 rounded-card bg-surface p-3">
            <div className="flex items-start gap-3">
              <ActivityIcon id={draft.activityId} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] text-fg-muted">
                  {ru.activities[draft.activityId]}
                </p>
                <p className="text-[17px] font-semibold">{draft.title}</p>
              </div>
            </div>
            <p className="line-clamp-3 text-[14px] text-fg-muted">
              {draft.description}
            </p>
            <p className="text-[14px]">
              {formatEventRange(
                new Date(draft.startsAt).toISOString(),
                new Date(draft.endsAt).toISOString(),
              )}
            </p>
            <p className="text-[14px] text-fg-muted">
              📍 {draft.location.address} · до {draft.capacity} чел.
            </p>
          </div>
        </section>

        <section className="rounded-card bg-surface p-4 text-center">
          {amount ? (
            <p className="text-[44px] leading-none font-bold tracking-tight tabular-nums">
              {amount}
            </p>
          ) : (
            <Skeleton className="mx-auto h-11 w-24" />
          )}
          <p className="mt-2 text-[15px] text-fg-muted">{ru.create.publishOnce}</p>
        </section>

        {create.isError && (
          <p role="alert" className="text-center text-[14px] text-danger">
            {ru.common.error}
          </p>
        )}
      </main>

      <div className="sticky bottom-0 border-t border-border bg-bg/85 px-4 py-3 backdrop-blur-xl">
        <Button
          size="lg"
          fullWidth
          loading={create.isPending}
          disabled={!quote}
          onClick={publish}
        >
          {create.isPending ? ru.create.publishing : ru.create.publishCta}
        </Button>
      </div>
    </>
  );
}

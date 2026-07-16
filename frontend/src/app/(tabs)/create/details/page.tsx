"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTags } from "@/lib/api/hooks";
import { ru } from "@/lib/i18n/ru";
import { useDraft } from "@/lib/stores/draft";
import { ActivityIcon } from "@/components/events/ActivityIcon";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Field, inputClass } from "@/components/ui/Field";
import { Header } from "@/components/ui/Header";

/** Step 2 of 4 — "Детали": название, описание, дата/время, место. */
export default function DetailsPage() {
  const router = useRouter();
  const draft = useDraft();
  const { data: tags } = useTags();
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Deep-linking here without a type would render a broken step.
  useEffect(() => {
    if (!draft.activityId) router.replace("/create");
  }, [draft.activityId, router]);

  if (!draft.activityId) return null;

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!draft.title.trim()) next.title = ru.create.errorTitle;
    if (!draft.description.trim()) next.description = ru.create.errorDescription;
    if (!draft.location?.address.trim()) next.place = ru.create.errorPlace;
    if (new Date(draft.endsAt) <= new Date(draft.startsAt))
      next.time = ru.create.errorTime;
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) router.push("/create/publish");
  }

  return (
    <>
      <Header title={ru.create.details} back="/create" />

      <form onSubmit={submit} className="flex-1 space-y-5 px-4 py-4">
        <div className="flex items-center gap-3 rounded-card bg-surface p-3">
          <ActivityIcon id={draft.activityId} />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] text-fg-muted">{ru.create.typeChosen}</p>
            <p className="truncate text-[16px] font-semibold">
              {ru.activities[draft.activityId]}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => router.push("/create")}>
            {ru.common.edit}
          </Button>
        </div>

        <Field label={ru.create.detailsTitle} error={errors.title}>
          {(p) => (
            <input
              {...p}
              value={draft.title}
              onChange={(e) => draft.patch({ title: e.target.value })}
              placeholder={ru.create.detailsTitlePlaceholder}
              className={inputClass(Boolean(errors.title))}
            />
          )}
        </Field>

        <Field label={ru.create.detailsDescription} error={errors.description}>
          {(p) => (
            <textarea
              {...p}
              rows={4}
              value={draft.description}
              onChange={(e) => draft.patch({ description: e.target.value })}
              placeholder={ru.create.detailsDescriptionPlaceholder}
              className={inputClass(Boolean(errors.description))}
            />
          )}
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label={ru.create.detailsStart}>
            {(p) => (
              <input
                {...p}
                type="datetime-local"
                value={draft.startsAt}
                onChange={(e) => draft.patch({ startsAt: e.target.value })}
                className={inputClass()}
              />
            )}
          </Field>
          <Field label={ru.create.detailsEnd} error={errors.time}>
            {(p) => (
              <input
                {...p}
                type="datetime-local"
                value={draft.endsAt}
                onChange={(e) => draft.patch({ endsAt: e.target.value })}
                className={inputClass(Boolean(errors.time))}
              />
            )}
          </Field>
        </div>

        <Field label={ru.create.detailsPlace} error={errors.place}>
          {(p) => (
            <input
              {...p}
              value={draft.location?.address ?? ""}
              onChange={(e) =>
                draft.patch({
                  location: {
                    // Geocoding lands with the backend; until then pin to Moscow
                    // centre so the map still has something to show.
                    lat: draft.location?.lat ?? 55.7558,
                    lng: draft.location?.lng ?? 37.6173,
                    address: e.target.value,
                  },
                })
              }
              placeholder={ru.create.detailsPlacePlaceholder}
              className={inputClass(Boolean(errors.place))}
            />
          )}
        </Field>

        <Field label={ru.create.detailsCapacity}>
          {(p) => (
            <input
              {...p}
              type="number"
              min={2}
              max={64}
              value={draft.capacity}
              onChange={(e) =>
                draft.patch({ capacity: Math.max(2, Number(e.target.value)) })
              }
              className={inputClass()}
            />
          )}
        </Field>

        {tags && (
          <div className="space-y-2">
            <p className="px-1 text-[13px] font-medium text-fg-muted">Теги</p>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Chip
                  key={tag.id}
                  selected={draft.tagIds.includes(tag.id)}
                  onClick={() => draft.toggleTag(tag.id)}
                >
                  {tag.label}
                </Chip>
              ))}
            </div>
          </div>
        )}

        <Button type="submit" size="lg" fullWidth>
          {ru.common.next}
        </Button>
      </form>
    </>
  );
}

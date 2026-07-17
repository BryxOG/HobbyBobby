"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTags } from "@/lib/api/hooks";
import { resolvePlaceByAddress, reverseGeocodePlace } from "@/lib/geo/client";
import { ru } from "@/lib/i18n/ru";
import { useDraft } from "@/lib/stores/draft";
import { ActivityIcon } from "@/components/events/ActivityIcon";
import { PlacePicker } from "@/components/map/PlacePicker";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Field, inputClass } from "@/components/ui/Field";
import { Header } from "@/components/ui/Header";
import { Skeleton } from "@/components/ui/States";

const LocationPickerMap = dynamic(
  () => import("@/components/map/LocationPickerMap").then((m) => m.LocationPickerMap),
  { ssr: false, loading: () => <Skeleton className="h-56 w-full rounded-card" /> },
);

/** Step 2 of 4 — "Детали": название, описание, дата/время, место. */
export default function DetailsPage() {
  const router = useRouter();
  const draft = useDraft();
  const { data: tags } = useTags();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [mapResolving, setMapResolving] = useState(false);

  // Deep-linking here without a type would render a broken step.
  useEffect(() => {
    if (!draft.activityId) router.replace("/create");
  }, [draft.activityId, router]);

  if (!draft.activityId) return null;

  function validate(location = draft.location): boolean {
    const next: Record<string, string> = {};
    if (!draft.title.trim()) next.title = ru.create.errorTitle;
    if (!draft.description.trim()) next.description = ru.create.errorDescription;
    if (!location?.address.trim()) next.place = ru.create.errorPlace;
    if (new Date(draft.endsAt) <= new Date(draft.startsAt))
      next.time = ru.create.errorTime;
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    let location = draft.location;
    if (location?.address.trim()) {
      try {
        const resolved = await resolvePlaceByAddress(location.address);
        if (resolved) {
          location = resolved;
          draft.patch({ location: resolved });
        }
      } catch {
        // Оставляем введённый адрес — валидация ниже решит, можно ли идти дальше.
      }
    }

    if (validate(location)) router.push("/create/publish");
  }

  async function onMapPick(coords: { lat: number; lng: number }) {
    setMapResolving(true);
    try {
      const place = await reverseGeocodePlace(coords.lat, coords.lng);
      draft.patch({
        location: place ?? {
          lat: coords.lat,
          lng: coords.lng,
          address: draft.location?.address ?? "",
        },
      });
    } catch {
      draft.patch({
        location: {
          lat: coords.lat,
          lng: coords.lng,
          address: draft.location?.address ?? "",
        },
      });
    } finally {
      setMapResolving(false);
    }
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
            <PlacePicker
              {...p}
              invalid={Boolean(errors.place)}
              value={draft.location}
              near={draft.location}
              onChange={(location) => draft.patch({ location })}
            />
          )}
        </Field>

        <div className="space-y-2">
          <p className="px-1 text-[13px] font-medium text-fg-muted">
            {ru.create.detailsMapHint}
          </p>
          <LocationPickerMap
            value={draft.location}
            onPick={(coords) => void onMapPick(coords)}
          />
          {mapResolving && (
            <p className="px-1 text-[12px] text-fg-muted">{ru.create.placeResolving}</p>
          )}
          {draft.location && (
            <p className="px-1 text-[12px] text-fg-muted">
              {ru.create.detailsCoords(draft.location.lat, draft.location.lng)}
            </p>
          )}
        </div>

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

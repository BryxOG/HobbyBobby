"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { useTags } from "@/lib/api/hooks";
import type { EventLocation } from "@/lib/api/types";
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
  const location = useDraft((s) => s.location);
  const patch = useDraft((s) => s.patch);
  const activityId = useDraft((s) => s.activityId);
  const title = useDraft((s) => s.title);
  const description = useDraft((s) => s.description);
  const startsAt = useDraft((s) => s.startsAt);
  const endsAt = useDraft((s) => s.endsAt);
  const capacity = useDraft((s) => s.capacity);
  const tagIds = useDraft((s) => s.tagIds);
  const toggleTag = useDraft((s) => s.toggleTag);
  const { data: tags } = useTags();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [mapResolving, setMapResolving] = useState(false);
  const [mapPanToken, setMapPanToken] = useState(0);

  function bumpMapPan() {
    setMapPanToken((token) => token + 1);
  }

  function onLocationChange(nextLocation: EventLocation) {
    const shouldPan =
      nextLocation.address.trim() &&
      !(nextLocation.lat === 0 && nextLocation.lng === 0);

    flushSync(() => {
      patch({ location: nextLocation });
      if (shouldPan) {
        setMapPanToken((token) => token + 1);
      }
    });
  }

  // Deep-linking here without a type would render a broken step.
  useEffect(() => {
    if (!activityId) router.replace("/create");
  }, [activityId, router]);

  if (!activityId) return null;

  function validate(nextLocation = location): boolean {
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = ru.create.errorTitle;
    if (!description.trim()) next.description = ru.create.errorDescription;
    if (!nextLocation?.address.trim()) next.place = ru.create.errorPlace;
    if (new Date(endsAt) <= new Date(startsAt)) next.time = ru.create.errorTime;
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    let nextLocation = location;
    if (nextLocation?.address.trim()) {
      try {
        const resolved = await resolvePlaceByAddress(nextLocation.address);
        if (resolved) {
          nextLocation = resolved;
          patch({ location: resolved });
          bumpMapPan();
        }
      } catch {
        // Оставляем введённый адрес — валидация ниже решит, можно ли идти дальше.
      }
    }

    if (validate(nextLocation)) router.push("/create/publish");
  }

  async function onMapPick(coords: { lat: number; lng: number }) {
    setMapResolving(true);
    try {
      const place = await reverseGeocodePlace(coords.lat, coords.lng);
      flushSync(() => {
        patch({
          location: place ?? {
            lat: coords.lat,
            lng: coords.lng,
            address: location?.address ?? `${coords.lat}, ${coords.lng}`,
          },
        });
        bumpMapPan();
      });
    } catch {
      flushSync(() => {
        patch({
          location: {
            lat: coords.lat,
            lng: coords.lng,
            address: location?.address ?? `${coords.lat}, ${coords.lng}`,
          },
        });
        bumpMapPan();
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
          <ActivityIcon id={activityId} />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] text-fg-muted">{ru.create.typeChosen}</p>
            <p className="truncate text-[16px] font-semibold">
              {ru.activities[activityId]}
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
              value={title}
              onChange={(e) => patch({ title: e.target.value })}
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
              value={description}
              onChange={(e) => patch({ description: e.target.value })}
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
                value={startsAt}
                onChange={(e) => patch({ startsAt: e.target.value })}
                className={inputClass()}
              />
            )}
          </Field>
          <Field label={ru.create.detailsEnd} error={errors.time}>
            {(p) => (
              <input
                {...p}
                type="datetime-local"
                value={endsAt}
                onChange={(e) => patch({ endsAt: e.target.value })}
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
              value={location}
              near={
                location && !(location.lat === 0 && location.lng === 0)
                  ? location
                  : null
              }
              onChange={onLocationChange}
            />
          )}
        </Field>

        <div className="space-y-2">
          <p className="px-1 text-[13px] font-medium text-fg-muted">
            {ru.create.detailsMapHint}
          </p>
          <LocationPickerMap
            key={`loc-map-${mapPanToken}`}
            value={location}
            onPick={(coords) => void onMapPick(coords)}
          />
          {mapResolving && (
            <p className="px-1 text-[12px] text-fg-muted">{ru.create.placeResolving}</p>
          )}
          {location && !(location.lat === 0 && location.lng === 0) && (
            <p className="px-1 text-[12px] text-fg-muted">
              {ru.create.detailsCoords(location.lat, location.lng)}
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
              value={capacity}
              onChange={(e) =>
                patch({ capacity: Math.max(2, Number(e.target.value)) })
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
                  selected={tagIds.includes(tag.id)}
                  onClick={() => toggleTag(tag.id)}
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

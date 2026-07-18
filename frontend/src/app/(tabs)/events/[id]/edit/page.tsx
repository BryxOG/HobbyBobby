"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { ACTIVITIES } from "@/lib/activities";
import { useEvent, useTags, useUpdateEvent } from "@/lib/api/hooks";
import type { ActivityId, EventItem, EventLocation } from "@/lib/api/types";
import { resolvePlaceByAddress, reverseGeocodePlace } from "@/lib/geo/client";
import { ru } from "@/lib/i18n/ru";
import { useAuth } from "@/lib/stores/auth";
import { toLocalInput } from "@/lib/stores/draft";
import { ActivityIcon } from "@/components/events/ActivityIcon";
import { PlacePicker } from "@/components/map/PlacePicker";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Field, inputClass } from "@/components/ui/Field";
import { Header } from "@/components/ui/Header";
import { ErrorState, Skeleton } from "@/components/ui/States";

const LocationPickerMap = dynamic(
  () => import("@/components/map/LocationPickerMap").then((m) => m.LocationPickerMap),
  { ssr: false, loading: () => <Skeleton className="h-56 w-full rounded-card" /> },
);

/** Редактирование ивента организатором. */
export default function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const userId = useAuth((s) => s.userId);
  const { data: event, isPending, isError, refetch } = useEvent(id);

  useEffect(() => {
    if (!event) return;
    const isOrganizer = userId != null && event.organizer.id === userId;
    if (!isOrganizer || event.status === "CANCELLED") {
      router.replace(`/events/${id}`);
    }
  }, [event, userId, router, id]);

  if (isError) {
    return (
      <>
        <Header title={ru.events.editTitle} back />
        <ErrorState onRetry={() => refetch()} />
      </>
    );
  }

  if (isPending || !event) {
    return (
      <>
        <Header title={ru.events.editTitle} back={`/events/${id}`} />
        <div className="space-y-4 p-4">
          <Skeleton className="h-14 w-full rounded-card" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
      </>
    );
  }

  return <EditEventForm key={event.id} event={event} />;
}

function EditEventForm({ event }: { event: EventItem }) {
  const router = useRouter();
  const { data: tags } = useTags();
  const update = useUpdateEvent();

  const [activityId, setActivityId] = useState<ActivityId>(event.activityId);
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description);
  const [startsAt, setStartsAt] = useState(toLocalInput(new Date(event.startsAt)));
  const [endsAt, setEndsAt] = useState(toLocalInput(new Date(event.endsAt)));
  const [location, setLocation] = useState<EventLocation | null>(event.location);
  const [capacity, setCapacity] = useState(event.capacity);
  const [tagIds, setTagIds] = useState(event.tags.map((t) => t.id));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [mapResolving, setMapResolving] = useState(false);

  const minCapacity = Math.max(2, event.participants.length);

  function validate(nextLocation = location): boolean {
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = ru.create.errorTitle;
    if (!description.trim()) next.description = ru.create.errorDescription;
    if (!nextLocation?.address.trim()) next.place = ru.create.errorPlace;
    if (new Date(endsAt) <= new Date(startsAt)) next.time = ru.create.errorTime;
    if (capacity < minCapacity) next.capacity = ru.events.errorCapacity;
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function toggleTag(tagId: string) {
    setTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId],
    );
  }

  async function onMapPick(coords: { lat: number; lng: number }) {
    setMapResolving(true);
    try {
      const place = await reverseGeocodePlace(coords.lat, coords.lng);
      setLocation(
        place ?? {
          lat: coords.lat,
          lng: coords.lng,
          address: location?.address ?? "",
        },
      );
    } catch {
      setLocation({
        lat: coords.lat,
        lng: coords.lng,
        address: location?.address ?? "",
      });
    } finally {
      setMapResolving(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    let nextLocation = location;
    if (nextLocation?.address.trim()) {
      try {
        const resolved = await resolvePlaceByAddress(nextLocation.address);
        if (resolved) {
          nextLocation = resolved;
          setLocation(resolved);
        }
      } catch {
        // оставляем введённый адрес
      }
    }

    if (!validate(nextLocation) || !nextLocation) return;

    update.mutate(
      {
        id: event.id,
        input: {
          title: title.trim(),
          activityId,
          description: description.trim(),
          startsAt: new Date(startsAt).toISOString(),
          endsAt: new Date(endsAt).toISOString(),
          location: nextLocation,
          capacity,
          tagIds,
        },
      },
      {
        onSuccess: () => router.replace(`/events/${event.id}`),
      },
    );
  }

  return (
    <>
      <Header title={ru.events.editTitle} back={`/events/${event.id}`} />

      <form onSubmit={(e) => void submit(e)} className="flex-1 space-y-5 px-4 py-4 pb-28">
        <div className="space-y-2">
          <p className="px-1 text-[13px] font-medium text-fg-muted">{ru.create.typeChosen}</p>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {ACTIVITIES.map((activity) => (
              <Chip
                key={activity.id}
                selected={activityId === activity.id}
                onClick={() => setActivityId(activity.id)}
              >
                <span className="inline-flex items-center gap-1.5">
                  <ActivityIcon id={activity.id} size="sm" />
                  {ru.activities[activity.id]}
                </span>
              </Chip>
            ))}
          </div>
        </div>

        <Field label={ru.create.detailsTitle} error={errors.title}>
          {(p) => (
            <input
              {...p}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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
              onChange={(e) => setDescription(e.target.value)}
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
                onChange={(e) => setStartsAt(e.target.value)}
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
                onChange={(e) => setEndsAt(e.target.value)}
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
              near={location}
              onChange={setLocation}
            />
          )}
        </Field>

        <div className="space-y-2">
          <p className="px-1 text-[13px] font-medium text-fg-muted">
            {ru.create.detailsMapHint}
          </p>
          <LocationPickerMap
            value={location}
            onPick={(coords) => void onMapPick(coords)}
          />
          {mapResolving && (
            <p className="px-1 text-[12px] text-fg-muted">{ru.create.placeResolving}</p>
          )}
        </div>

        <Field label={ru.create.detailsCapacity} error={errors.capacity}>
          {(p) => (
            <input
              {...p}
              type="number"
              min={minCapacity}
              max={64}
              value={capacity}
              onChange={(e) =>
                setCapacity(Math.max(minCapacity, Number(e.target.value)))
              }
              className={inputClass(Boolean(errors.capacity))}
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

        {update.isError && (
          <p role="alert" className="text-center text-[14px] text-danger">
            {ru.common.error}
          </p>
        )}

        <Button type="submit" size="lg" fullWidth loading={update.isPending}>
          {update.isPending ? ru.events.saving : ru.events.saveChanges}
        </Button>
      </form>
    </>
  );
}

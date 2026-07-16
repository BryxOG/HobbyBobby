"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { ACTIVITIES } from "@/lib/activities";
import { usePins } from "@/lib/api/hooks";
import type { ActivityId, GeoPoint } from "@/lib/api/types";
import { formatEventRange } from "@/lib/format";
import { ru } from "@/lib/i18n/ru";
import { useSettings } from "@/lib/stores/settings";
import { ActivityIcon } from "@/components/events/ActivityIcon";
import { Chip } from "@/components/ui/Chip";
import { Skeleton } from "@/components/ui/States";

// MapLibre touches window at import time — it must never render on the server.
const EventMap = dynamic(
  () => import("@/components/map/EventMap").then((m) => m.EventMap),
  { ssr: false, loading: () => <Skeleton className="size-full rounded-none" /> },
);

export default function MapPage() {
  return (
    <Suspense fallback={<Skeleton className="size-full rounded-none" />}>
      <MapScreen />
    </Suspense>
  );
}

function MapScreen() {
  const searchParams = useSearchParams();
  const focusId = searchParams.get("focus");

  const theme = useSettings((s) => s.theme);
  const geoEnabled = useSettings((s) => s.geolocation);

  const [activities, setActivities] = useState<ActivityId[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(focusId);
  const [coords, setCoords] = useState<GeoPoint | null>(null);

  const filters = useMemo(() => ({ activityIds: activities }), [activities]);
  const { data: pins } = usePins(filters);

  const selected = pins?.find((p) => p.id === selectedId) ?? null;
  const focusPin = focusId ? (pins?.find((p) => p.id === focusId) ?? null) : null;

  // Only ask for coordinates when the Настройки toggle allows it.
  useEffect(() => {
    if (!geoEnabled || !("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setCoords(null),
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }, [geoEnabled]);

  // Derived, not mirrored: flipping the toggle off hides the dot without a
  // second render pass, and re-enabling reuses the coords we already have.
  const me = geoEnabled ? coords : null;

  function toggle(id: ActivityId) {
    setActivities((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
    );
  }

  return (
    <div className="relative flex-1 overflow-hidden">
      <div className="absolute inset-0">
        <EventMap
          pins={pins ?? []}
          theme={theme}
          onSelect={setSelectedId}
          selectedId={selectedId}
          focus={focusPin?.location ?? null}
          me={me}
        />
      </div>

      {/* Floating filter rail — "Виды активности" from the sketch. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 pt-[env(safe-area-inset-top)]">
        <div className="pointer-events-auto overflow-x-auto px-3 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max gap-2">
            <Chip
              selected={activities.length === 0}
              onClick={() => setActivities([])}
              className="shadow-md"
            >
              {ru.map.filterAll}
            </Chip>
            {ACTIVITIES.map((activity) => (
              <Chip
                key={activity.id}
                selected={activities.includes(activity.id)}
                onClick={() => toggle(activity.id)}
                className="shadow-md"
              >
                <span aria-hidden>{activity.emoji}</span>
                {ru.activities[activity.id]}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      {pins && (
        <p className="pointer-events-none absolute bottom-3 left-3 z-10 rounded-full bg-bg/85 px-3 py-1 text-[12px] font-medium text-fg-muted shadow-md backdrop-blur">
          {ru.map.pinsCount(pins.length)}
        </p>
      )}

      {/* Tapped pin — preview card, tap through for the full screen. */}
      {selected && (
        <div className="absolute inset-x-3 bottom-3 z-20">
          <article className="relative flex items-center gap-3 rounded-sheet bg-bg p-3 shadow-xl ring-1 ring-border">
            <ActivityIcon id={selected.activityId} />
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-[16px] font-semibold">
                <Link
                  href={`/events/${selected.id}`}
                  className="after:absolute after:inset-0 after:content-['']"
                >
                  {selected.title}
                </Link>
              </h2>
              <p className="truncate text-[13px] text-fg-muted">
                {formatEventRange(selected.startsAt, selected.startsAt)}
              </p>
              <p className="text-[13px] font-medium tabular-nums text-fg-muted">
                {selected.participantCount}/{selected.capacity}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              aria-label={ru.common.cancel}
              className="relative z-10 grid size-7 shrink-0 place-items-center rounded-full bg-surface text-fg-muted active:scale-90"
            >
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                className="size-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </article>
        </div>
      )}
    </div>
  );
}

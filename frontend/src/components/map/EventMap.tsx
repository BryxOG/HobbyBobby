"use client";

import { useEffect, useRef, useState } from "react";
import { getActivity } from "@/lib/activities";
import type { EventPin, GeoPoint } from "@/lib/api/types";
import { ru } from "@/lib/i18n/ru";
import { DEFAULT_ZOOM, FALLBACK_CENTER } from "./mapStyle";
import {
  detectBrowserCenter,
  loadYandexMapsApi,
  setMapLocation,
  type YMaps3Api,
} from "./yandexMaps";

interface Props {
  pins: EventPin[];
  onSelect: (id: string) => void;
  selectedId?: string | null;
  /** Pans here once when set — used by "Смотреть карту" after publishing. */
  focus?: GeoPoint | null;
  me?: GeoPoint | null;
}

/**
 * MapLibre wrapper. The map instance lives outside React state on purpose:
 * re-rendering must never rebuild it, so markers are diffed by hand.
 */
export function EventMap({
  pins,
  onSelect,
  selectedId,
  focus,
  me,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ymapsRef = useRef<YMaps3Api | null>(null);
  const mapRef = useRef<InstanceType<YMaps3Api["YMap"]> | null>(null);
  const markersRef = useRef(new Map<string, unknown>());
  const markerElementsRef = useRef(new Map<string, HTMLButtonElement>());
  const meMarkerRef = useRef<unknown | null>(null);
  const [mapReady, setMapReady] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Markers are wired up once, but must call the latest handler — keep it in a
  // ref, updated after commit rather than during render.
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let isMounted = true;
    void loadYandexMapsApi()
      .then(async (ymaps3) => {
        await ymaps3.ready;
        if (!isMounted || !containerRef.current) return;

        ymapsRef.current = ymaps3;
        const browserCenter = await detectBrowserCenter();
        const center: [number, number] = focus
          ? [focus.lng, focus.lat]
          : me
            ? [me.lng, me.lat]
            : browserCenter ?? FALLBACK_CENTER;
        const map = new ymaps3.YMap(containerRef.current, {
          location: { center, zoom: focus ? 14 : DEFAULT_ZOOM },
          behaviors: ["drag", "scrollZoom", "pinchZoom", "dblClick"],
        });
        map.addChild(new ymaps3.YMapDefaultSchemeLayer({}));
        map.addChild(new ymaps3.YMapDefaultFeaturesLayer({}));
        mapRef.current = map;
        setLoadError(null);
        setMapReady((value) => value + 1);
      })
      .catch((error: unknown) => {
        if (!isMounted) return;
        const message =
          error instanceof Error
            ? error.message
            : ru.map.loadError;
        setLoadError(message);
      });

    const markers = markersRef.current;
    const markerElements = markerElementsRef.current;
    return () => {
      isMounted = false;
      for (const marker of markers.values()) {
        mapRef.current?.removeChild?.(marker);
      }
      mapRef.current?.destroy?.();
      mapRef.current = null;
      markers.clear();
      markerElements.clear();
      meMarkerRef.current = null;
      ymapsRef.current = null;
    };
  }, [focus, me]);

  // Diff markers: add new pins, drop stale ones, leave the rest untouched.
  useEffect(() => {
    const map = mapRef.current;
    const ymaps3 = ymapsRef.current;
    if (!map || !ymaps3) return;

    const next = new Set(pins.map((p) => p.id));

    for (const [id, marker] of Array.from(markersRef.current.entries())) {
      if (!next.has(id)) {
        map.removeChild?.(marker);
        markersRef.current.delete(id);
        markerElementsRef.current.delete(id);
      }
    }

    for (const pin of pins) {
      if (markersRef.current.has(pin.id)) continue;

      const el = document.createElement("button");
      el.type = "button";
      el.setAttribute("aria-label", pin.title);
      el.className = "hb-pin";
      el.textContent = getActivity(pin.activityId).emoji;
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelectRef.current(pin.id);
      });

      const marker = new ymaps3.YMapMarker(
        { coordinates: [pin.location.lng, pin.location.lat] },
        el,
      );
      map.addChild(marker);
      markersRef.current.set(pin.id, marker);
      markerElementsRef.current.set(pin.id, el);
    }
  }, [pins, mapReady]);

  useEffect(() => {
    for (const [id, element] of markerElementsRef.current) {
      element?.classList.toggle("hb-pin--active", id === selectedId);
    }
  }, [selectedId, pins, mapReady]);

  useEffect(() => {
    if (!focus || !mapRef.current) return;
    setMapLocation(mapRef.current, {
      center: [focus.lng, focus.lat],
      zoom: 14,
      duration: 800,
    });
  }, [focus, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    const ymaps3 = ymapsRef.current;
    if (!map || !ymaps3) return;

    if (!me) {
      if (meMarkerRef.current) {
        map.removeChild?.(meMarkerRef.current);
      }
      meMarkerRef.current = null;
      return;
    }

    if (!meMarkerRef.current) {
      const el = document.createElement("div");
      el.className = "hb-me";
      el.setAttribute("aria-label", ru.map.locate);
      meMarkerRef.current = new ymaps3.YMapMarker(
        { coordinates: [me.lng, me.lat] },
        el,
      );
      map.addChild(meMarkerRef.current);
      return;
    }
    map.removeChild?.(meMarkerRef.current);
    const el = document.createElement("div");
    el.className = "hb-me";
    el.setAttribute("aria-label", ru.map.locate);
    meMarkerRef.current = new ymaps3.YMapMarker(
      { coordinates: [me.lng, me.lat] },
      el,
    );
    map.addChild(meMarkerRef.current);
  }, [me, mapReady]);

  if (loadError) {
    return (
      <div className="grid size-full place-items-center bg-surface p-4 text-center">
        <div className="space-y-2">
          <p className="text-[15px] font-semibold">{ru.map.loadError}</p>
          <p className="text-[13px] text-fg-muted">
            {loadError.includes("NEXT_PUBLIC_YANDEX_MAPS_API_KEY")
              ? ru.map.noApiKey
              : loadError}
          </p>
        </div>
      </div>
    );
  }

  return <div ref={containerRef} className="size-full" />;
}

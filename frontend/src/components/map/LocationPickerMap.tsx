"use client";

import { useEffect, useRef, useState } from "react";
import type { EventLocation } from "@/lib/api/types";
import { ru } from "@/lib/i18n/ru";
import { DEFAULT_ZOOM, FALLBACK_CENTER } from "./mapStyle";
import {
  detectBrowserCenter,
  loadYandexMapsApi,
  setMapLocation,
  type YMaps3Api,
} from "./yandexMaps";

interface Props {
  value: EventLocation | null;
  onPick: (coords: { lat: number; lng: number }) => void;
}

/**
 * Карта выбора координат для мастера создания ивента.
 */
export function LocationPickerMap({ value, onPick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ymapsRef = useRef<YMaps3Api | null>(null);
  const mapRef = useRef<InstanceType<YMaps3Api["YMap"]> | null>(null);
  const markerRef = useRef<unknown | null>(null);
  const onPickRef = useRef(onPick);
  const hasAutoCentered = useRef(false);
  const [mapReady, setMapReady] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let isMounted = true;
    void loadYandexMapsApi()
      .then(async (ymaps3) => {
        await ymaps3.ready;
        if (!isMounted || !containerRef.current) return;
        ymapsRef.current = ymaps3;

        const browserCenter = await detectBrowserCenter();
        const center: [number, number] = value
          ? [value.lng, value.lat]
          : browserCenter ?? FALLBACK_CENTER;
        const map = new ymaps3.YMap(containerRef.current, {
          location: { center, zoom: value ? 13 : DEFAULT_ZOOM },
          behaviors: ["drag", "scrollZoom", "pinchZoom", "dblClick"],
        });
        map.addChild(new ymaps3.YMapDefaultSchemeLayer({}));
        map.addChild(new ymaps3.YMapDefaultFeaturesLayer({}));

        const listener = new ymaps3.YMapListener({
          layer: "any",
          onClick: (_object, event) => {
            if (!event.coordinates || event.coordinates.length < 2) return;
            const [lng, lat] = event.coordinates;
            onPickRef.current({
              lat: Number(lat.toFixed(6)),
              lng: Number(lng.toFixed(6)),
            });
          },
        });
        map.addChild(listener);
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

    return () => {
      isMounted = false;
      if (markerRef.current) {
        mapRef.current?.removeChild?.(markerRef.current);
      }
      markerRef.current = null;
      mapRef.current?.destroy?.();
      mapRef.current = null;
      ymapsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const ymaps3 = ymapsRef.current;
    if (!map || !ymaps3) return;

    if (!value) {
      if (markerRef.current) {
        map.removeChild?.(markerRef.current);
      }
      markerRef.current = null;
      return;
    }

    const coordinates: [number, number] = [value.lng, value.lat];
    if (!markerRef.current) {
      const el = document.createElement("div");
      el.className = "hb-me";
      markerRef.current = new ymaps3.YMapMarker({ coordinates }, el);
      map.addChild(markerRef.current);
    } else {
      map.removeChild?.(markerRef.current);
      const el = document.createElement("div");
      el.className = "hb-me";
      markerRef.current = new ymaps3.YMapMarker({ coordinates }, el);
      map.addChild(markerRef.current);
    }

    if (!hasAutoCentered.current) {
      setMapLocation(map, { center: coordinates, zoom: 14, duration: 700 });
      hasAutoCentered.current = true;
    }
  }, [value, mapReady]);

  if (loadError) {
    return (
      <div className="grid h-56 w-full place-items-center rounded-card bg-surface p-4 text-center">
        <div className="space-y-1">
          <p className="text-[14px] font-semibold">{ru.map.loadError}</p>
          <p className="text-[12px] text-fg-muted">
            {loadError.includes("NEXT_PUBLIC_YANDEX_MAPS_API_KEY")
              ? ru.map.noApiKey
              : loadError}
          </p>
        </div>
      </div>
    );
  }

  return <div ref={containerRef} className="h-56 w-full overflow-hidden rounded-card" />;
}

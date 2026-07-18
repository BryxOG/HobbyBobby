"use client";

import { useEffect, useRef, useState } from "react";
import type { EventLocation } from "@/lib/api/types";
import { ru } from "@/lib/i18n/ru";
import { DEFAULT_ZOOM, FALLBACK_CENTER } from "./mapStyle";
import { MapLoadError } from "./MapLoadError";
import {
  detectBrowserCenter,
  loadYandexMapsApi,
  resetYandexMapsLoader,
  type YMapLike,
  type YMaps3Api,
} from "./yandexMaps";

interface Props {
  value: EventLocation | null;
  onPick: (coords: { lat: number; lng: number }) => void;
}

/** Есть реальные координаты (не заглушка 0,0). */
function hasValidCoords(
  location: EventLocation | null,
): location is EventLocation {
  if (!location) return false;
  if (location.lat === 0 && location.lng === 0) return false;
  return Number.isFinite(location.lat) && Number.isFinite(location.lng);
}

/** Пин показываем только когда есть и адрес, и координаты. */
function isDisplayableLocation(
  location: EventLocation | null,
): location is EventLocation {
  if (!hasValidCoords(location)) return false;
  return Boolean(location.address.trim());
}

/**
 * Карта выбора координат для мастера создания ивента.
 * Родитель перемонтирует компонент через key при выборе нового места.
 */
export function LocationPickerMap({ value, onPick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ymapsRef = useRef<YMaps3Api | null>(null);
  const mapRef = useRef<YMapLike | null>(null);
  const markerRef = useRef<unknown | null>(null);
  const onPickRef = useRef(onPick);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [mapEpoch, setMapEpoch] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  const initialCenter = hasValidCoords(value)
    ? { lat: value.lat, lng: value.lng }
    : null;

  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  useEffect(() => {
    if (!containerRef.current) return;

    let isMounted = true;

    void loadYandexMapsApi()
      .then(async (ymaps3) => {
        await ymaps3.ready;
        if (!isMounted || !containerRef.current) return;

        ymapsRef.current = ymaps3;

        const centerTarget = initialCenter;
        let center: [number, number];
        let zoom = DEFAULT_ZOOM;

        if (centerTarget) {
          center = [centerTarget.lng, centerTarget.lat];
          zoom = 14;
        } else {
          const browserCenter = await detectBrowserCenter();
          if (!isMounted || !containerRef.current) return;
          center = browserCenter ?? FALLBACK_CENTER;
        }

        const map = new ymaps3.YMap(containerRef.current, {
          location: { center, zoom },
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
        setMapEpoch((epoch) => epoch + 1);
      })
      .catch((error: unknown) => {
        if (!isMounted) return;
        const message =
          error instanceof Error ? error.message : ru.map.loadError;
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
    // initialCenter фиксируется при монтировании (родитель меняет key).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadAttempt]);

  useEffect(() => {
    const map = mapRef.current;
    const ymaps3 = ymapsRef.current;
    if (!map || !ymaps3) return;

    if (!isDisplayableLocation(value)) {
      if (markerRef.current) {
        map.removeChild?.(markerRef.current);
      }
      markerRef.current = null;
      return;
    }

    const coordinates: [number, number] = [value.lng, value.lat];
    if (markerRef.current) {
      map.removeChild?.(markerRef.current);
    }
    const el = document.createElement("div");
    el.className = "hb-me";
    markerRef.current = new ymaps3.YMapMarker({ coordinates }, el);
    map.addChild(markerRef.current);
  }, [value?.lat, value?.lng, value?.address, mapEpoch]);

  function retryLoad() {
    resetYandexMapsLoader();
    setLoadError(null);
    setLoadAttempt((n) => n + 1);
  }

  if (loadError) {
    return <MapLoadError error={loadError} compact onRetry={retryLoad} />;
  }

  return <div ref={containerRef} className="h-56 w-full overflow-hidden rounded-card" />;
}

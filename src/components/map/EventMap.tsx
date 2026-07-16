"use client";

import maplibregl, { Map as MapLibreMap, Marker } from "maplibre-gl";
import { useEffect, useRef } from "react";
import { getActivity } from "@/lib/activities";
import type { EventPin, GeoPoint } from "@/lib/api/types";
import { ru } from "@/lib/i18n/ru";
import "maplibre-gl/dist/maplibre-gl.css";
import { DEFAULT_ZOOM, MOSCOW_CENTER, osmStyle } from "./mapStyle";

interface Props {
  pins: EventPin[];
  theme: "light" | "dark";
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
  theme,
  onSelect,
  selectedId,
  focus,
  me,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef(new Map<string, Marker>());
  const meMarkerRef = useRef<Marker | null>(null);

  // Markers are wired up once, but must call the latest handler — keep it in a
  // ref, updated after commit rather than during render.
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: osmStyle(theme),
      center: MOSCOW_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    mapRef.current = map;

    const markers = markersRef.current; // Capture for cleanup.
    return () => {
      map.remove();
      mapRef.current = null;
      markers.clear();
    };
    // Theme is handled by the effect below; re-running here would drop the map.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    mapRef.current?.setStyle(osmStyle(theme));
  }, [theme]);

  // Diff markers: add new pins, drop stale ones, leave the rest untouched.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const next = new Set(pins.map((p) => p.id));

    for (const [id, marker] of markersRef.current) {
      if (!next.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
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

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([pin.location.lng, pin.location.lat])
        .addTo(map);
      markersRef.current.set(pin.id, marker);
    }
  }, [pins]);

  useEffect(() => {
    for (const [id, marker] of markersRef.current) {
      marker.getElement().classList.toggle("hb-pin--active", id === selectedId);
    }
  }, [selectedId, pins]);

  useEffect(() => {
    if (!focus || !mapRef.current) return;
    mapRef.current.flyTo({
      center: [focus.lng, focus.lat],
      zoom: 14,
      duration: 800,
    });
  }, [focus]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!me) {
      meMarkerRef.current?.remove();
      meMarkerRef.current = null;
      return;
    }

    if (!meMarkerRef.current) {
      const el = document.createElement("div");
      el.className = "hb-me";
      el.setAttribute("aria-label", ru.map.locate);
      meMarkerRef.current = new maplibregl.Marker({ element: el }).addTo(map);
    }
    meMarkerRef.current.setLngLat([me.lng, me.lat]);
  }, [me]);

  return <div ref={containerRef} className="size-full" />;
}

import type { StyleSpecification } from "maplibre-gl";

/**
 * Raster OSM style — no API key, no account, works offline-ish via the SW cache.
 *
 * Swapping to a vector provider later means replacing this object only; the map
 * component never names a tile source.
 */
export function osmStyle(theme: "light" | "dark"): StyleSpecification {
  return {
    version: 8,
    sources: {
      osm: {
        type: "raster",
        tiles: [
          "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
          "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
          "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
        ],
        tileSize: 256,
        maxzoom: 19,
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      },
    },
    layers: [
      {
        id: "background",
        type: "background",
        paint: { "background-color": theme === "dark" ? "#000000" : "#e9ecef" },
      },
      {
        id: "osm",
        type: "raster",
        source: "osm",
        paint: {
          // OSM ships no dark tiles; invert+rotate hue approximates one.
          "raster-saturation": theme === "dark" ? -0.6 : -0.2,
          "raster-brightness-min": theme === "dark" ? 0.05 : 0,
          "raster-brightness-max": theme === "dark" ? 0.45 : 1,
          "raster-contrast": theme === "dark" ? 0.1 : 0,
        },
      },
    ],
  };
}

export const MOSCOW_CENTER: [number, number] = [37.6173, 55.7558];
export const DEFAULT_ZOOM = 11;

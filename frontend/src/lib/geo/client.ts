import type { PlaceSuggestion, ResolvedPlace, SuggestOptions } from "./types";

/**
 * Клиентские обёртки над Next.js API routes геокодинга.
 */
export async function fetchPlaceSuggestions(
  text: string,
  options: SuggestOptions,
): Promise<PlaceSuggestion[]> {
  const params = new URLSearchParams({
    text,
    sessionToken: options.sessionToken,
  });
  if (options.near) {
    params.set("lat", String(options.near.lat));
    params.set("lng", String(options.near.lng));
  }

  const response = await fetch(`/api/geo/suggest?${params.toString()}`);
  if (!response.ok) {
    throw new Error("suggest_failed");
  }
  return (await response.json()) as PlaceSuggestion[];
}

export async function resolvePlaceByUri(uri: string): Promise<ResolvedPlace | null> {
  const params = new URLSearchParams({ uri });
  const response = await fetch(`/api/geo/geocode?${params.toString()}`);
  if (!response.ok) {
    throw new Error("geocode_failed");
  }
  const data = (await response.json()) as { place: ResolvedPlace | null };
  return data.place;
}

export async function resolvePlaceByAddress(address: string): Promise<ResolvedPlace | null> {
  const params = new URLSearchParams({ geocode: address });
  const response = await fetch(`/api/geo/geocode?${params.toString()}`);
  if (!response.ok) {
    throw new Error("geocode_failed");
  }
  const data = (await response.json()) as { place: ResolvedPlace | null };
  return data.place;
}

export async function reverseGeocodePlace(
  lat: number,
  lng: number,
): Promise<ResolvedPlace | null> {
  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
  });
  const response = await fetch(`/api/geo/geocode?${params.toString()}`);
  if (!response.ok) {
    throw new Error("geocode_failed");
  }
  const data = (await response.json()) as { place: ResolvedPlace | null };
  return data.place;
}

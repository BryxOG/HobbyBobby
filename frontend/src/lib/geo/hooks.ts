"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchPlaceSuggestions } from "./client";

/**
 * Подсказки мест с debounce на стороне вызывающего компонента.
 */
export function usePlaceSuggestions(
  text: string,
  options: {
    enabled: boolean;
    sessionToken: string;
    near?: { lat: number; lng: number };
  },
) {
  const query = text.trim();
  return useQuery({
    queryKey: ["geo", "suggest", query, options.near, options.sessionToken],
    queryFn: () =>
      fetchPlaceSuggestions(query, {
        sessionToken: options.sessionToken,
        near: options.near,
      }),
    enabled: options.enabled && query.length >= 2,
    staleTime: 30_000,
    retry: false,
  });
}

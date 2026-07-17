import type { EventLocation } from "@/lib/api/types";

/** Подсказка из Yandex Suggest API. */
export interface PlaceSuggestion {
  id: string;
  title: string;
  subtitle: string | null;
  uri: string | null;
}

export interface SuggestOptions {
  /** Центр окна поиска — приоритетнее геолокации пользователя. */
  near?: { lat: number; lng: number };
  /** Токен сессии ввода для биллинга Suggest API. */
  sessionToken: string;
}

export type ResolvedPlace = EventLocation;

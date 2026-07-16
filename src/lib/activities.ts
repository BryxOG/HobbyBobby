import type { Activity, ActivityCategory, ActivityId } from "@/lib/api/types";

/**
 * The activity catalog drawn in the sketch's "Выберите тип" / "Интересы" grids
 * and the map's "Виды активности" filter.
 */
export const ACTIVITIES: Activity[] = [
  { id: "basketball", emoji: "🏀", category: "sport" },
  { id: "football", emoji: "⚽", category: "sport" },
  { id: "volleyball", emoji: "🏐", category: "sport" },
  { id: "boxing", emoji: "🥊", category: "sport" },
  { id: "skating", emoji: "⛸️", category: "sport" },
  { id: "tennis", emoji: "🎾", category: "sport" },
  { id: "cycling", emoji: "🚴", category: "sport" },
  { id: "baseball", emoji: "⚾", category: "sport" },
  { id: "bowling", emoji: "🎳", category: "sport" },

  { id: "karaoke", emoji: "🎤", category: "hobby" },
  { id: "gaming", emoji: "🎮", category: "hobby" },
  { id: "art", emoji: "🎨", category: "hobby" },
  { id: "crafts", emoji: "🧶", category: "hobby" },
  { id: "boardgames", emoji: "🎲", category: "hobby" },

  { id: "coffee", emoji: "☕", category: "social" },
  { id: "bar", emoji: "🍻", category: "social" },
  { id: "party", emoji: "🪩", category: "social" },
  { id: "theatre", emoji: "🎭", category: "social" },
  { id: "support", emoji: "🫂", category: "social" },
];

export const ACTIVITY_CATEGORIES: ActivityCategory[] = [
  "sport",
  "hobby",
  "social",
];

const BY_ID = new Map<ActivityId, Activity>(ACTIVITIES.map((a) => [a.id, a]));

export function getActivity(id: ActivityId): Activity {
  const found = BY_ID.get(id);
  if (!found) throw new Error(`Unknown activity: ${id}`);
  return found;
}

export function activitiesByCategory(category: ActivityCategory): Activity[] {
  return ACTIVITIES.filter((a) => a.category === category);
}

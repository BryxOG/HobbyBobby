"use client";

import { create } from "zustand";
import type { ActivityId, EventLocation } from "@/lib/api/types";

/**
 * The create-event wizard spans four routes (тип → детали → публикация →
 * опубликовано), so the half-built event lives here rather than in URL state.
 */
interface DraftState {
  activityId: ActivityId | null;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  location: EventLocation | null;
  capacity: number;
  tagIds: string[];
  publishedId: string | null;

  setActivity: (id: ActivityId) => void;
  patch: (patch: Partial<Omit<DraftState, "patch" | "reset">>) => void;
  toggleTag: (id: string) => void;
  reset: () => void;
}

function defaultStart(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(19, 0, 0, 0);
  return toLocalInput(d);
}

function defaultEnd(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(22, 0, 0, 0);
  return toLocalInput(d);
}

/** <input type="datetime-local"> wants local time with no timezone suffix. */
export function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const initial = {
  activityId: null,
  title: "",
  description: "",
  startsAt: defaultStart(),
  endsAt: defaultEnd(),
  location: null,
  capacity: 4,
  tagIds: [],
  publishedId: null,
};

export const useDraft = create<DraftState>()((set) => ({
  ...initial,
  setActivity: (activityId) => set({ activityId }),
  patch: (patch) => set(patch),
  toggleTag: (id) =>
    set((s) => ({
      tagIds: s.tagIds.includes(id)
        ? s.tagIds.filter((t) => t !== id)
        : [...s.tagIds, id],
    })),
  reset: () => set({ ...initial, startsAt: defaultStart(), endsAt: defaultEnd() }),
}));

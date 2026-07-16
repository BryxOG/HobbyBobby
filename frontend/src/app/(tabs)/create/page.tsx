"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useDraft } from "@/lib/stores/draft";
import type { ActivityId } from "@/lib/api/types";
import { ru } from "@/lib/i18n/ru";
import { ActivityGrid } from "@/components/events/ActivityGrid";
import { Header } from "@/components/ui/Header";

/** Step 1 of 4 — "Выберите тип". Picking a type advances immediately. */
export default function ChooseTypePage() {
  const router = useRouter();
  const activityId = useDraft((s) => s.activityId);
  const publishedId = useDraft((s) => s.publishedId);
  const setActivity = useDraft((s) => s.setActivity);
  const reset = useDraft((s) => s.reset);

  // A publishedId means the last run finished, so this is a new event. Clearing
  // here rather than on the "Опубликовано" screen keeps that screen's guard
  // from firing mid-navigation.
  useEffect(() => {
    if (publishedId) reset();
  }, [publishedId, reset]);

  function select(id: ActivityId) {
    setActivity(id);
    router.push("/create/details");
  }

  return (
    <>
      <Header title={ru.create.chooseType} large />
      <main className="flex-1 px-4 py-3">
        <ActivityGrid
          mode="single"
          selected={activityId ? [activityId] : []}
          onSelect={select}
        />
      </main>
    </>
  );
}

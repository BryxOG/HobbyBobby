"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ru } from "@/lib/i18n/ru";
import { useDraft } from "@/lib/stores/draft";
import { Button } from "@/components/ui/Button";

/** Step 4 of 4 — "Опубликовано", with "Смотреть карту" focused on the new pin. */
export default function DonePage() {
  const router = useRouter();
  const publishedId = useDraft((s) => s.publishedId);

  useEffect(() => {
    if (!publishedId) router.replace("/create");
  }, [publishedId, router]);

  if (!publishedId) return null;

  // Deliberately no reset() here: clearing publishedId would trip the guard
  // above and bounce us to /create instead of the destination. The finished
  // draft is cleared when the wizard next starts.
  function go(href: string) {
    router.push(href);
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
      <span
        aria-hidden
        className="grid size-20 place-items-center rounded-full bg-success/15 text-[40px]"
      >
        ✅
      </span>

      <h1 className="text-[28px] leading-tight font-bold tracking-tight">
        {ru.create.published}
      </h1>
      <p className="text-[15px] text-balance text-fg-muted">
        {ru.create.publishedHint}
      </p>

      <div className="mt-6 w-full space-y-2">
        <Button
          size="lg"
          fullWidth
          onClick={() => go(`/map?focus=${publishedId}`)}
        >
          {ru.create.viewOnMap}
        </Button>
        <Button
          variant="secondary"
          size="lg"
          fullWidth
          onClick={() => go(`/events/${publishedId}`)}
        >
          {ru.events.title}
        </Button>
      </div>
    </main>
  );
}

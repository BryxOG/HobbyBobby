"use client";

import { useState } from "react";
import { useMe, useSetInterests } from "@/lib/api/hooks";
import type { ActivityId } from "@/lib/api/types";
import { ru } from "@/lib/i18n/ru";
import { ActivityGrid } from "@/components/events/ActivityGrid";
import { Button } from "@/components/ui/Button";
import { Header } from "@/components/ui/Header";
import { Skeleton } from "@/components/ui/States";

/** Интересы — multi-select grid feeding the news feed and map ranking. */
export default function InterestsPage() {
  const { data: me } = useMe();
  const save = useSetInterests();

  // `null` means untouched — fall through to the server's list rather than
  // copying it into state, which would need an effect to stay in sync.
  const [edited, setEdited] = useState<ActivityId[] | null>(null);
  const selected = edited ?? me?.interests ?? null;

  function toggle(id: ActivityId) {
    const base = selected ?? [];
    setEdited(
      base.includes(id) ? base.filter((a) => a !== id) : [...base, id],
    );
  }

  const dirty =
    me != null &&
    selected != null &&
    (selected.length !== me.interests.length ||
      selected.some((id) => !me.interests.includes(id)));

  return (
    <>
      <Header title={ru.interests.title} back="/menu" />

      <main className="flex-1 space-y-4 px-4 py-4">
        <p className="text-[14px] text-fg-muted">{ru.interests.hint}</p>

        {selected === null ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <>
            <p className="text-[13px] font-medium text-fg-muted">
              {ru.interests.count(selected.length)}
            </p>
            <ActivityGrid mode="multi" selected={selected} onSelect={toggle} />
          </>
        )}
      </main>

      <div className="sticky bottom-0 border-t border-border bg-bg/85 px-4 py-3 backdrop-blur-xl">
        <Button
          size="lg"
          fullWidth
          disabled={!dirty}
          loading={save.isPending}
          onClick={() => selected && save.mutate(selected)}
        >
          {save.isSuccess && !dirty ? ru.interests.saved : ru.common.save}
        </Button>
      </div>
    </>
  );
}

"use client";

import { useState } from "react";
import { useMe, useUpdateMe } from "@/lib/api/hooks";
import { ru } from "@/lib/i18n/ru";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Header } from "@/components/ui/Header";
import { inputClass } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/States";

type EditableField = "name" | "city" | "bio";

/** Профиль — counters, level, rating, and per-field ✏️ editing from the sketch. */
export default function ProfilePage() {
  const { data: me, isPending } = useMe();
  const update = useUpdateMe();
  const [editing, setEditing] = useState<EditableField | null>(null);
  const [value, setValue] = useState("");

  function start(field: EditableField, current: string) {
    setEditing(field);
    setValue(current);
  }

  function save() {
    if (!editing) return;
    const trimmed = value.trim();
    if (trimmed) update.mutate({ [editing]: trimmed });
    setEditing(null);
  }

  if (isPending || !me) {
    return (
      <>
        <Header title={ru.profile.title} back="/menu" />
        <div className="space-y-4 p-4">
          <Skeleton className="mx-auto size-20 rounded-full" />
          <Skeleton className="mx-auto h-6 w-1/3" />
          <Skeleton className="h-16 w-full" />
        </div>
      </>
    );
  }

  return (
    <>
      <Header title={ru.profile.title} back="/menu" />

      <main className="flex-1 space-y-6 px-4 py-4">
        <section className="flex flex-col items-center gap-2 text-center">
          <Avatar user={me} size="xl" />
          <div>
            <h1 className="text-[22px] font-bold tracking-tight">{me.name}</h1>
            <p className="text-[14px] text-fg-muted">{me.email}</p>
          </div>
          <span className="rounded-full bg-elevated px-2.5 py-1 text-[13px] font-semibold">
            {me.level} {ru.profile.level}
            {me.rating != null && ` · ${me.rating}/5⭐`}
          </span>
        </section>

        <section className="grid grid-cols-3 divide-x divide-border overflow-hidden rounded-card bg-surface">
          <Counter value={me.counts.followers} label={ru.profile.followers} />
          <Counter value={me.counts.following} label={ru.profile.following} />
          <Counter value={me.counts.events} label={ru.profile.events} />
        </section>

        <section className="divide-y divide-border overflow-hidden rounded-card bg-surface">
          <EditableRow
            label={ru.profile.name}
            value={me.name}
            editing={editing === "name"}
            draft={value}
            onDraft={setValue}
            onEdit={() => start("name", me.name)}
            onSave={save}
            onCancel={() => setEditing(null)}
            ariaLabel={ru.profile.editName}
          />
          <EditableRow
            label={ru.profile.city}
            value={me.city}
            editing={editing === "city"}
            draft={value}
            onDraft={setValue}
            onEdit={() => start("city", me.city)}
            onSave={save}
            onCancel={() => setEditing(null)}
            ariaLabel={ru.profile.editCity}
          />
          <EditableRow
            label={ru.profile.about}
            value={me.bio}
            multiline
            editing={editing === "bio"}
            draft={value}
            onDraft={setValue}
            onEdit={() => start("bio", me.bio)}
            onSave={save}
            onCancel={() => setEditing(null)}
            ariaLabel={ru.profile.editBio}
          />
        </section>
      </main>
    </>
  );
}

function Counter({ value, label }: { value: number; label: string }) {
  return (
    <div className="px-2 py-3 text-center">
      <p className="text-[20px] font-bold tabular-nums">{value}</p>
      <p className="text-[12px] text-fg-muted">{label}</p>
    </div>
  );
}

interface RowProps {
  label: string;
  value: string;
  editing: boolean;
  draft: string;
  multiline?: boolean;
  ariaLabel: string;
  onDraft: (v: string) => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}

function EditableRow({
  label,
  value,
  editing,
  draft,
  multiline,
  ariaLabel,
  onDraft,
  onEdit,
  onSave,
  onCancel,
}: RowProps) {
  if (editing) {
    return (
      <div className="space-y-2 p-3">
        <p className="text-[13px] font-medium text-fg-muted">{label}</p>
        {multiline ? (
          <textarea
            autoFocus
            rows={3}
            value={draft}
            onChange={(e) => onDraft(e.target.value)}
            aria-label={ariaLabel}
            className={inputClass()}
          />
        ) : (
          <input
            autoFocus
            value={draft}
            onChange={(e) => onDraft(e.target.value)}
            aria-label={ariaLabel}
            className={inputClass()}
          />
        )}
        <div className="flex gap-2">
          <Button size="sm" onClick={onSave}>
            {ru.common.save}
          </Button>
          <Button size="sm" variant="secondary" onClick={onCancel}>
            {ru.common.cancel}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 p-3">
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-fg-muted">{label}</p>
        <p className="text-[15px] break-words whitespace-pre-line">
          {value || "—"}
        </p>
      </div>
      <button
        type="button"
        onClick={onEdit}
        aria-label={ariaLabel}
        className="shrink-0 rounded-lg px-1.5 py-1 text-[16px] active:scale-90"
      >
        ✏️
      </button>
    </div>
  );
}

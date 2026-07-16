import { ru } from "@/lib/i18n/ru";

const DATE_TIME = new Intl.DateTimeFormat("ru-RU", {
  weekday: "short",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

const TIME = new Intl.DateTimeFormat("ru-RU", {
  hour: "2-digit",
  minute: "2-digit",
});

const DAY_MONTH = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
});

/** "Пт, 23 июля, 20:00 – 23:00" — the format used in the sketch. */
export function formatEventRange(startsAt: string, endsAt: string): string {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const parts = DATE_TIME.formatToParts(start);
  const pick = (t: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === t)?.value ?? "";
  const weekday = capitalize(pick("weekday").replace(".", ""));
  return `${weekday}, ${pick("day")} ${pick("month")}, ${TIME.format(start)} – ${TIME.format(end)}`;
}

/** "30.04 · 10:30" — the compact form on chat/list rows. */
export function formatShortDateTime(iso: string): string {
  const d = new Date(iso);
  return `${DAY_MONTH.format(d)} · ${TIME.format(d)}`;
}

export function formatTime(iso: string): string {
  return TIME.format(new Date(iso));
}

/** "1 нед." — relative age for the chat list preview. */
export function formatRelative(iso: string, now: Date = new Date()): string {
  const diffMs = now.getTime() - new Date(iso).getTime();
  const min = Math.round(diffMs / 60_000);
  if (min < 1) return ru.time.now;
  if (min < 60) return ru.time.minutesAgo(min);
  const hours = Math.round(min / 60);
  if (hours < 24) return ru.time.hoursAgo(hours);
  const days = Math.round(hours / 24);
  if (days < 7) return ru.time.daysAgo(days);
  return ru.time.weeksAgo(Math.round(days / 7));
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

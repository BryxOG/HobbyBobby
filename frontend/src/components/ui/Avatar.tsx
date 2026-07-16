"use client";

import { cn } from "@/lib/cn";
import type { UserSummary } from "@/lib/api/types";

const SIZES = {
  sm: "size-7 text-[11px]",
  md: "size-9 text-[13px]",
  lg: "size-16 text-[22px]",
  xl: "size-20 text-[28px]",
};

/** Deterministic tint per user so faces stay recognisable across screens. */
const TINTS = [
  "bg-[#e7f5ff] text-[#1971c2] dark:bg-[#1971c2]/25 dark:text-[#a5d8ff]",
  "bg-[#e6fcf5] text-[#0ca678] dark:bg-[#0ca678]/25 dark:text-[#63e6be]",
  "bg-[#fff0f6] text-[#c2255c] dark:bg-[#c2255c]/25 dark:text-[#faa2c1]",
  "bg-[#fff9db] text-[#e67700] dark:bg-[#e67700]/25 dark:text-[#ffe066]",
  "bg-[#f3f0ff] text-[#6741d9] dark:bg-[#6741d9]/25 dark:text-[#d0bfff]",
];

function tintFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return TINTS[Math.abs(hash) % TINTS.length];
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function Avatar({
  user,
  size = "md",
  className,
}: {
  user: Pick<UserSummary, "id" | "name" | "avatarUrl">;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-semibold select-none",
        SIZES[size],
        tintFor(user.id),
        className,
      )}
    >
      {initials(user.name)}
    </span>
  );
}

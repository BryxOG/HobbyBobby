"use client";

import { useJoinEvent, useLeaveEvent } from "@/lib/api/hooks";
import type { EventItem } from "@/lib/api/types";
import { ru } from "@/lib/i18n/ru";
import { Button } from "@/components/ui/Button";

/**
 * The sketch's "Участвовать" ↔ "Отменить" toggle. Green when joinable, red when
 * already in — the two states are different colours, not one restyled button.
 */
export function JoinButton({
  event,
  size = "sm",
  fullWidth,
}: {
  event: EventItem;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}) {
  const join = useJoinEvent();
  const leave = useLeaveEvent();

  const pending = join.isPending || leave.isPending;
  const isFull = event.participants.length >= event.capacity;

  if (event.isJoined) {
    return (
      <Button
        variant="danger"
        size={size}
        fullWidth={fullWidth}
        loading={pending}
        onClick={() => leave.mutate(event.id)}
      >
        {ru.events.leave}
      </Button>
    );
  }

  return (
    <Button
      variant="success"
      size={size}
      fullWidth={fullWidth}
      loading={pending}
      disabled={isFull}
      onClick={() => join.mutate(event.id)}
    >
      {isFull ? ru.events.full : ru.events.join}
    </Button>
  );
}

"use client";

import { useEffect } from "react";
import { USING_MOCK_CHATS } from "@/lib/api/http/chats";
import { httpEventMembership } from "@/lib/api/http/eventMembership";

/**
 * Синхронизирует участие в EventService, если UI уже показывает isJoined.
 */
export function useSyncChatMembership(
  eventId: string,
  isJoined: boolean | undefined,
) {
  useEffect(() => {
    if (USING_MOCK_CHATS || !isJoined || !eventId) return;
    void httpEventMembership.join(eventId).catch(() => {
      // Ивент может отсутствовать в EventService — чат только для синхронизированных.
    });
  }, [eventId, isJoined]);
}

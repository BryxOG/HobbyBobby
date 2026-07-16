"use client";

import { useQueryClient } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { USING_MOCK_CHATS } from "@/lib/api/http/chats";
import { applyRealtimeMessage } from "@/lib/api/realtime/chatCache";
import {
  buildChatSocketUrl,
  type WsServerPayload,
} from "@/lib/api/realtime/chatSocket";
import { useAuth } from "@/lib/stores/auth";

const RECONNECT_MS = 3_000;

/**
 * Держит WebSocket к realtime-service и обновляет кэш чатов.
 */
export function ChatRealtimeBridge() {
  const userId = useAuth((s) => s.userId);
  const pathname = usePathname();
  const qc = useQueryClient();

  const openChatId = pathname.match(/^\/chats\/([^/]+)/)?.[1] ?? null;

  useEffect(() => {
    if (USING_MOCK_CHATS || !userId) return;

    const activeUserId = userId;
    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;

    function connect() {
      if (disposed) return;

      socket = new WebSocket(buildChatSocketUrl(activeUserId));

      socket.addEventListener("message", (event) => {
        try {
          const payload = JSON.parse(event.data as string) as WsServerPayload;
          if (payload.type !== "MESSAGE_NEW") return;
          applyRealtimeMessage(qc, payload, openChatId);
        } catch {
          // Нераспознанный фрейм — игнорируем.
        }
      });

      socket.addEventListener("close", () => {
        if (disposed) return;
        reconnectTimer = setTimeout(connect, RECONNECT_MS);
      });
    }

    connect();

    return () => {
      disposed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, [userId, qc, openChatId]);

  return null;
}

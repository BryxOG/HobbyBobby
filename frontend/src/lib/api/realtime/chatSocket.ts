/** Базовый URL realtime-service (WebSocket). */
export const REALTIME_WS_URL =
  process.env.NEXT_PUBLIC_REALTIME_WS_URL ?? "ws://localhost:9003";

/** Событие нового сообщения с WebSocket. */
export interface WsMessageNewPayload {
  type: "MESSAGE_NEW";
  messageId: string;
  eventId: string;
  author: {
    id: string;
    name: string;
    avatarUrl: string | null;
    level: number;
    rating: number | null;
  };
  text: string;
  sentAt: string;
  isOwn: boolean;
}

export type WsServerPayload = WsMessageNewPayload | { type: "PONG" };

/**
 * Создаёт URL WebSocket с идентификатором пользователя.
 *
 * @param userId идентификатор вошедшего пользователя
 * @returns полный ws:// URL
 */
export function buildChatSocketUrl(userId: string): string {
  const base = REALTIME_WS_URL.replace(/\/$/, "");
  return `${base}/ws?userId=${encodeURIComponent(userId)}`;
}

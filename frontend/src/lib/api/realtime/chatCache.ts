import type { QueryClient } from "@tanstack/react-query";
import { qk } from "../queryKeys";
import type { ChatMessage, ChatSummary } from "../types";
import type { WsMessageNewPayload } from "./chatSocket";

/**
 * Преобразует WebSocket payload в ChatMessage.
 *
 * @param payload событие MESSAGE_NEW
 * @returns сообщение для кэша TanStack Query
 */
export function wsPayloadToMessage(payload: WsMessageNewPayload): ChatMessage {
  return {
    id: payload.messageId,
    eventId: payload.eventId,
    author: {
      id: payload.author.id,
      name: payload.author.name,
      avatarUrl: payload.author.avatarUrl,
      level: payload.author.level,
      rating: payload.author.rating,
    },
    text: payload.text,
    sentAt: payload.sentAt,
    isOwn: payload.isOwn,
  };
}

/**
 * Добавляет сообщение в кэш комнаты, если его ещё нет.
 *
 * @param qc      query client
 * @param message новое сообщение
 */
export function appendMessageToCache(qc: QueryClient, message: ChatMessage) {
  qc.setQueryData<ChatMessage[]>(qk.messages(message.eventId), (current) => {
    if (!current) return [message];
    if (current.some((item) => item.id === message.id)) return current;
    return [...current, message];
  });
}

/**
 * Обновляет превью чата в списке после нового сообщения.
 *
 * @param qc           query client
 * @param message      новое сообщение
 * @param openEventId  eventId открытой комнаты (unread не растёт)
 */
export function touchChatListCache(
  qc: QueryClient,
  message: ChatMessage,
  openEventId?: string | null,
) {
  qc.setQueryData<ChatSummary[]>(qk.chats, (current) => {
    if (!current) return current;

    const next = current.map((chat) => {
      if (chat.eventId !== message.eventId) return chat;
      const incrementUnread =
        !message.isOwn && message.eventId !== openEventId;
      return {
        ...chat,
        lastMessage: {
          text: message.text,
          sentAt: message.sentAt,
          isOwn: message.isOwn,
        },
        unreadCount: incrementUnread ? chat.unreadCount + 1 : chat.unreadCount,
      };
    });

    next.sort((a, b) => {
      const at = a.lastMessage ? new Date(a.lastMessage.sentAt).getTime() : 0;
      const bt = b.lastMessage ? new Date(b.lastMessage.sentAt).getTime() : 0;
      return bt - at;
    });

    return next;
  });
}

/**
 * Сбрасывает unread для чата в кэше списка.
 *
 * @param qc      query client
 * @param eventId идентификатор ивента
 */
export function markChatReadInCache(qc: QueryClient, eventId: string) {
  qc.setQueryData<ChatSummary[]>(qk.chats, (current) =>
    current?.map((chat) =>
      chat.eventId === eventId ? { ...chat, unreadCount: 0 } : chat,
    ),
  );
}

/**
 * Применяет realtime-сообщение к кэшу сообщений и списка чатов.
 *
 * @param qc           query client
 * @param payload      WebSocket payload
 * @param openEventId  eventId открытой комнаты
 */
export function applyRealtimeMessage(
  qc: QueryClient,
  payload: WsMessageNewPayload,
  openEventId?: string | null,
) {
  const message = wsPayloadToMessage(payload);
  appendMessageToCache(qc, message);
  touchChatListCache(qc, message, openEventId);
}

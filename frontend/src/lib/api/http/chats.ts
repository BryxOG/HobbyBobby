import { USING_MOCK_USERS } from "./users";
import { eventRequest } from "./eventRequest";
import type { ChatMessage, ChatSummary } from "../types";

const MOCK_CHATS_ENV = process.env.NEXT_PUBLIC_USE_MOCK_CHATS;

/**
 * true — чаты из in-memory моков; false — EventService + WebSocket.
 * По умолчанию следует режиму пользователей (моки только если USE_MOCK_USERS).
 */
export const USING_MOCK_CHATS =
  MOCK_CHATS_ENV === "true" ||
  (MOCK_CHATS_ENV !== "false" && USING_MOCK_USERS);

/** HTTP-реализация chats-части ApiClient. */
export const httpChatsClient = {
  async list(): Promise<ChatSummary[]> {
    return eventRequest<ChatSummary[]>("/chats");
  },

  async messages(eventId: string): Promise<ChatMessage[]> {
    return eventRequest<ChatMessage[]>(`/chats/${eventId}/messages`);
  },

  async send(eventId: string, text: string): Promise<ChatMessage> {
    return eventRequest<ChatMessage>(`/chats/${eventId}/messages`, {
      method: "POST",
      body: JSON.stringify({ text }),
    });
  },
};

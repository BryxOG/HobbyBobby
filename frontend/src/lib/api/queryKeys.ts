import type { EventListQuery, MyEventsScope } from "./types";

export const qk = {
  events: ["events"] as const,
  eventList: (q: EventListQuery) => ["events", "list", q] as const,
  eventDetail: (id: string) => ["events", "detail", id] as const,
  eventsMine: (scope: MyEventsScope, q: EventListQuery = {}) =>
    ["events", "mine", scope, q] as const,
  publishQuote: ["events", "publish-quote"] as const,
  searchParse: (q: string) => ["events", "search-parse", q] as const,
  pins: (q: EventListQuery) => ["map", "pins", q] as const,
  chats: ["chats"] as const,
  messages: (eventId: string) => ["chats", eventId, "messages"] as const,
  me: ["users", "me"] as const,
  tags: ["tags"] as const,
};

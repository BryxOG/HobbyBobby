import { eventRequest } from "./eventRequest";
import type {
  ApiClient,
  CreateEventInput,
  EventItem,
  EventListQuery,
  EventPin,
  MyEventsScope,
  Page,
  ParseSearchInput,
  PublishQuote,
  SearchIntent,
  Tag,
} from "../types";

const MOCK_EVENTS_ENV = process.env.NEXT_PUBLIC_USE_MOCK_EVENTS;

/**
 * true — ивенты из in-memory моков; false — EventService REST API.
 * По умолчанию следует режиму пользователей.
 */
export const USING_MOCK_EVENTS =
  MOCK_EVENTS_ENV === "true" ||
  (MOCK_EVENTS_ENV !== "false" &&
    process.env.NEXT_PUBLIC_USE_MOCK_USERS === "true");

/** Собирает query string из параметров ленты. */
function toSearchParams(query: EventListQuery = {}): string {
  const params = new URLSearchParams();
  if (query.cursor) params.set("cursor", query.cursor);
  if (query.limit != null) params.set("limit", String(query.limit));
  if (query.query) params.set("query", query.query);
  for (const id of query.activityIds ?? []) {
    params.append("activityIds", id);
  }
  for (const id of query.tagIds ?? []) {
    params.append("tagIds", id);
  }
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  if (query.near) {
    params.set("nearLat", String(query.near.lat));
    params.set("nearLng", String(query.near.lng));
  }
  if (query.radiusKm != null) params.set("radiusKm", String(query.radiusKm));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/**
 * Дополняет поля, которые бэкенд может опустить из‑за JsonInclude.NON_NULL.
 *
 * @param event сырой ответ EventService
 * @returns EventItem с дефолтами контракта фронта
 */
function normalizeEvent(event: EventItem): EventItem {
  return {
    ...event,
    tags: event.tags ?? [],
    participants: event.participants ?? [],
    rating: event.rating ?? null,
    status: event.status ?? "ACTIVE",
    cancelledAt: event.cancelledAt ?? null,
  };
}

/**
 * Нормализует страницу ивентов.
 *
 * @param page ответ с cursor-пагинацией
 * @returns страница с нормализованными items
 */
function normalizePage(page: Page<EventItem>): Page<EventItem> {
  return {
    ...page,
    items: page.items.map(normalizeEvent),
  };
}

/** HTTP-реализация events/map/tags части ApiClient. */
export const httpEventsClient: Pick<ApiClient, "events" | "map" | "tags"> = {
  events: {
    async list(query: EventListQuery = {}): Promise<Page<EventItem>> {
      const page = await eventRequest<Page<EventItem>>(
        `/events${toSearchParams(query)}`,
      );
      return normalizePage(page);
    },

    async get(id: string): Promise<EventItem> {
      return normalizeEvent(await eventRequest<EventItem>(`/events/${id}`));
    },

    async mine(
      scope: MyEventsScope,
      query: EventListQuery = {},
    ): Promise<Page<EventItem>> {
      const params = new URLSearchParams(toSearchParams(query).replace(/^\?/, ""));
      params.set("scope", scope);
      const qs = params.toString();
      const page = await eventRequest<Page<EventItem>>(`/events/mine?${qs}`);
      return normalizePage(page);
    },

    async create(input: CreateEventInput): Promise<EventItem> {
      return normalizeEvent(
        await eventRequest<EventItem>("/events", {
          method: "POST",
          body: JSON.stringify(input),
        }),
      );
    },

    async update(id: string, input: CreateEventInput): Promise<EventItem> {
      return normalizeEvent(
        await eventRequest<EventItem>(`/events/${id}`, {
          method: "PUT",
          body: JSON.stringify(input),
        }),
      );
    },

    async join(id: string): Promise<EventItem> {
      return normalizeEvent(
        await eventRequest<EventItem>(`/events/${id}/join`, { method: "POST" }),
      );
    },

    async leave(id: string): Promise<EventItem> {
      return normalizeEvent(
        await eventRequest<EventItem>(`/events/${id}/leave`, {
          method: "POST",
        }),
      );
    },

    async publishQuote(): Promise<PublishQuote> {
      return eventRequest<PublishQuote>("/events/publish-quote");
    },

    async cancel(id: string): Promise<EventItem> {
      return normalizeEvent(
        await eventRequest<EventItem>(`/events/${id}/cancel`, {
          method: "POST",
        }),
      );
    },

    async parseSearch(input: ParseSearchInput): Promise<SearchIntent> {
      return eventRequest<SearchIntent>("/events/search/parse", {
        method: "POST",
        body: JSON.stringify({
          query: input.query,
          userLat: input.userLat ?? null,
          userLng: input.userLng ?? null,
        }),
      });
    },
  },

  map: {
    async pins(query: EventListQuery = {}): Promise<EventPin[]> {
      return eventRequest<EventPin[]>(`/map/pins${toSearchParams(query)}`);
    },
  },

  tags: {
    async list(): Promise<Tag[]> {
      return eventRequest<Tag[]>("/tags");
    },
  },
};

import { eventRequest } from "./eventRequest";
import type {
  ApiClient,
  CreateEventInput,
  EventItem,
  EventListQuery,
  EventPin,
  MyEventsScope,
  Page,
  PublishQuote,
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

/** HTTP-реализация events/map/tags части ApiClient. */
export const httpEventsClient: Pick<ApiClient, "events" | "map" | "tags"> = {
  events: {
    async list(query: EventListQuery = {}): Promise<Page<EventItem>> {
      return eventRequest<Page<EventItem>>(`/events${toSearchParams(query)}`);
    },

    async get(id: string): Promise<EventItem> {
      return eventRequest<EventItem>(`/events/${id}`);
    },

    async mine(
      scope: MyEventsScope,
      query: EventListQuery = {},
    ): Promise<Page<EventItem>> {
      const params = new URLSearchParams(toSearchParams(query).replace(/^\?/, ""));
      params.set("scope", scope);
      const qs = params.toString();
      return eventRequest<Page<EventItem>>(`/events/mine?${qs}`);
    },

    async create(input: CreateEventInput): Promise<EventItem> {
      return eventRequest<EventItem>("/events", {
        method: "POST",
        body: JSON.stringify(input),
      });
    },

    async join(id: string): Promise<EventItem> {
      return eventRequest<EventItem>(`/events/${id}/join`, { method: "POST" });
    },

    async leave(id: string): Promise<EventItem> {
      return eventRequest<EventItem>(`/events/${id}/leave`, { method: "POST" });
    },

    async publishQuote(): Promise<PublishQuote> {
      return eventRequest<PublishQuote>("/events/publish-quote");
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

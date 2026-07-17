import type {
  ApiClient,
  ChatMessage,
  ChatSummary,
  CreateEventInput,
  EventItem,
  EventListQuery,
  EventPin,
  MyEventsScope,
  Page,
  PublishQuote,
  UserProfile,
} from "@/lib/api/types";
import { ru } from "@/lib/i18n/ru";
import * as db from "./db";

const PAGE_SIZE = 10; // Fixed by the spec.

/** Enough delay that skeletons and disabled states are actually exercised. */
function latency<T>(value: T, ms = 220): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Stands in for Postgres full-text search: title + description + activity name. */
function matchesText(event: EventItem, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const haystack = [
    event.title,
    event.description,
    event.location.address,
    event.organizer.name,
    ru.activities[event.activityId],
  ]
    .join(" ")
    .toLowerCase();
  return needle.split(/\s+/).every((word) => haystack.includes(word));
}

function applyFilters(source: EventItem[], q: EventListQuery = {}): EventItem[] {
  return source.filter((e) => {
    if (q.query && !matchesText(e, q.query)) return false;
    if (q.activityIds?.length && !q.activityIds.includes(e.activityId))
      return false;
    if (q.tagIds?.length && !e.tags.some((t) => q.tagIds!.includes(t.id)))
      return false;
    if (q.from && new Date(e.startsAt) < new Date(q.from)) return false;
    if (q.to && new Date(e.startsAt) > new Date(q.to)) return false;
    if (q.near && q.radiusKm != null) {
      if (haversineKm(q.near, e.location) > q.radiusKm) return false;
    }
    return true;
  });
}

function paginate<T>(items: T[], cursor?: string | null, limit = PAGE_SIZE) {
  const start = cursor ? Number(cursor) : 0;
  const slice = items.slice(start, start + limit);
  const next = start + limit;
  return {
    items: clone(slice),
    nextCursor: next < items.length ? String(next) : null,
    total: items.length,
  } satisfies Page<T>;
}

function byStartAsc(a: EventItem, b: EventItem) {
  return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
}

function findEvent(id: string): EventItem {
  const event = db.events.find((e) => e.id === id);
  if (!event) throw new Error(`Event not found: ${id}`);
  return event;
}

/** Chat exists for every event the user organizes or has joined. */
function myEventIds(): string[] {
  return db.events
    .filter(
      (e) =>
        e.organizer.id === db.ME_ID ||
        e.participants.some((p) => p.id === db.ME_ID),
    )
    .map((e) => e.id);
}

export const mockClient: ApiClient = {
  events: {
    async list(query = {}) {
      const filtered = applyFilters(db.events, query).sort(byStartAsc);
      return latency(paginate(filtered, query.cursor, query.limit));
    },

    async get(id) {
      return latency(clone(findEvent(id)));
    },

    async mine(scope: MyEventsScope, query = {}) {
      const filtered = applyFilters(db.events, query)
        .filter((e) =>
          scope === "organizing"
            ? e.organizer.id === db.ME_ID
            : e.organizer.id !== db.ME_ID &&
              e.participants.some((p) => p.id === db.ME_ID),
        )
        .sort(byStartAsc);
      return latency(paginate(filtered, query.cursor, query.limit));
    },

    async create(input: CreateEventInput) {
      const me = db.currentUser();
      const event: EventItem = {
        id: `e-new-${Date.now()}`,
        title: input.title,
        activityId: input.activityId,
        description: input.description,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        location: input.location,
        organizer: me,
        participants: [me],
        capacity: input.capacity,
        tags: input.tagIds
          .map((id) => db.tags.find((t) => t.id === id))
          .filter((t): t is NonNullable<typeof t> => Boolean(t)),
        isJoined: true,
        rating: me.rating,
        status: "ACTIVE",
        cancelledAt: null,
      };
      db.events.push(event);
      db.profile.counts.events += 1;
      return latency(clone(event), 600); // Publishing feels like work.
    },

    async join(id) {
      const event = findEvent(id);
      if (event.participants.length >= event.capacity) {
        throw new Error("EVENT_FULL");
      }
      if (!event.participants.some((p) => p.id === db.ME_ID)) {
        event.participants.push(db.currentUser());
      }
      event.isJoined = true;
      return latency(clone(event));
    },

    async leave(id) {
      const event = findEvent(id);
      event.participants = event.participants.filter((p) => p.id !== db.ME_ID);
      event.isJoined = false;
      return latency(clone(event));
    },

    async publishQuote(): Promise<PublishQuote> {
      return latency({
        amount: 50,
        currency: "RUB",
        label: ru.create.publishOnce,
      });
    },

    async cancel(id) {
      const event = findEvent(id);
      event.status = "CANCELLED";
      event.cancelledAt = new Date().toISOString();
      return latency(clone(event));
    },

    async parseSearch(input) {
      return latency({
        rawQuery: input.query,
        activityIds: [],
        from: null,
        to: null,
        near:
          input.userLat != null && input.userLng != null
            ? { lat: input.userLat, lng: input.userLng }
            : null,
        radiusKm: null,
        city: null,
        tagIds: [],
        freeText: input.query.trim() || null,
        interpretedAs: { when: null, what: null, where: null },
        confidence: 0.2,
      });
    },
  },

  map: {
    async pins(query = {}) {
      const pins: EventPin[] = applyFilters(db.events, query).map((e) => ({
        id: e.id,
        activityId: e.activityId,
        location: e.location,
        title: e.title,
        startsAt: e.startsAt,
        participantCount: e.participants.length,
        capacity: e.capacity,
      }));
      return latency(clone(pins), 120);
    },
  },

  chats: {
    async list() {
      const summaries: ChatSummary[] = myEventIds().map((eventId) => {
        const event = findEvent(eventId);
        const last = [...db.messages]
          .filter((m) => m.eventId === eventId)
          .sort(
            (a, b) =>
              new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
          )
          .at(-1);
        return {
          eventId,
          title: event.title,
          activityId: event.activityId,
          organizer: event.organizer,
          lastMessage: last
            ? { text: last.text, sentAt: last.sentAt, isOwn: last.isOwn }
            : null,
          unreadCount: db.unread[eventId] ?? 0,
        };
      });

      // Most recent conversation first; chats with no messages sink.
      summaries.sort((a, b) => {
        const at = a.lastMessage ? new Date(a.lastMessage.sentAt).getTime() : 0;
        const bt = b.lastMessage ? new Date(b.lastMessage.sentAt).getTime() : 0;
        return bt - at;
      });
      return latency(clone(summaries));
    },

    async messages(eventId) {
      const list = db.messages
        .filter((m) => m.eventId === eventId)
        .sort(
          (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
        );
      db.unread[eventId] = 0;
      return latency(clone(list), 160);
    },

    async send(eventId, text) {
      const message: ChatMessage = {
        id: db.nextMessageId(),
        eventId,
        author: db.currentUser(),
        text,
        sentAt: new Date().toISOString(),
        isOwn: true,
      };
      db.pushMessage(message);
      return latency(clone(message), 120);
    },
  },

  users: {
    async me() {
      return latency(clone(db.profile));
    },

    async updateMe(patch: Partial<UserProfile>) {
      db.setProfile(patch);
      return latency(clone(db.profile));
    },

    async setInterests(interests) {
      db.setProfile({ interests });
      return latency(clone(db.profile));
    },
  },

  tags: {
    async list() {
      return latency(clone(db.tags));
    },
  },
};

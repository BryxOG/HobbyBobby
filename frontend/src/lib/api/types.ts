/**
 * Domain contract shared by the whole frontend.
 *
 * Every screen reads these types and nothing else — the mock implementation in
 * `./mock` is the only place that invents data. When EventService/UserService
 * land, only `client.ts` swaps to fetch(); these shapes are the DTOs to match.
 */

export type ActivityCategory = "sport" | "hobby" | "social";

/** Stable ids — the emoji is presentation, the id is what crosses the wire. */
export type ActivityId =
  | "basketball"
  | "football"
  | "volleyball"
  | "boxing"
  | "skating"
  | "tennis"
  | "cycling"
  | "baseball"
  | "bowling"
  | "karaoke"
  | "gaming"
  | "art"
  | "crafts"
  | "boardgames"
  | "coffee"
  | "bar"
  | "party"
  | "theatre"
  | "support";

export interface Activity {
  id: ActivityId;
  emoji: string;
  category: ActivityCategory;
}

export interface Tag {
  id: string;
  label: string;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface EventLocation extends GeoPoint {
  address: string;
}

export interface UserSummary {
  id: string;
  name: string;
  avatarUrl: string | null;
  /** Gamification level from the sketch ("67 LVL"). */
  level: number;
  /** Organizer rating from the sketch ("4.9/5⭐"). Null until rated. */
  rating: number | null;
}

export interface UserProfile extends UserSummary {
  email: string;
  city: string;
  bio: string;
  counts: {
    followers: number;
    following: number;
    events: number;
  };
  interests: ActivityId[];
  location: GeoPoint | null;
}

export type EventStatus = "ACTIVE" | "CANCELLED";

export interface EventItem {
  id: string;
  title: string;
  activityId: ActivityId;
  description: string;
  startsAt: string;
  endsAt: string;
  location: EventLocation;
  organizer: UserSummary;
  participants: UserSummary[];
  capacity: number;
  tags: Tag[];
  /** Whether the *current* user has joined. Server-derived, never client-guessed. */
  isJoined: boolean;
  rating: number | null;
  status: EventStatus;
  cancelledAt: string | null;
}

/** Trimmed event shape for map pins — avoids shipping descriptions for 500 pins. */
export interface EventPin {
  id: string;
  activityId: ActivityId;
  location: EventLocation;
  title: string;
  startsAt: string;
  participantCount: number;
  capacity: number;
}

export interface ChatMessage {
  id: string;
  eventId: string;
  author: UserSummary;
  text: string;
  sentAt: string;
  isOwn: boolean;
}

export interface ChatSummary {
  eventId: string;
  title: string;
  activityId: ActivityId;
  organizer: UserSummary;
  lastMessage: Pick<ChatMessage, "text" | "sentAt" | "isOwn"> | null;
  unreadCount: number;
}

/** Cursor pagination. The spec fixes page size at 10. */
export interface Page<T> {
  items: T[];
  nextCursor: string | null;
  total: number;
}

export interface EventListQuery {
  cursor?: string | null;
  limit?: number;
  query?: string;
  activityIds?: ActivityId[];
  tagIds?: string[];
  from?: string;
  to?: string;
  near?: GeoPoint;
  radiusKm?: number;
}

/** Результат NL-парсера (POST /events/search/parse). */
export interface SearchInterpretedAs {
  when: string | null;
  what: string | null;
  where: string | null;
}

export interface SearchIntent {
  rawQuery: string;
  activityIds: ActivityId[];
  from: string | null;
  to: string | null;
  near: GeoPoint | null;
  radiusKm: number | null;
  city: string | null;
  tagIds: string[];
  freeText: string | null;
  interpretedAs: SearchInterpretedAs;
  confidence: number;
}

export interface ParseSearchInput {
  query: string;
  userLat?: number | null;
  userLng?: number | null;
}

export type MyEventsScope = "organizing" | "participating";

export interface CreateEventInput {
  title: string;
  activityId: ActivityId;
  description: string;
  startsAt: string;
  endsAt: string;
  location: EventLocation;
  capacity: number;
  tagIds: string[];
}

export interface AppSettings {
  notifications: boolean;
  geolocation: boolean;
  language: "ru";
  theme: "light" | "dark";
}

/** Payment for the one-off publish step (50 ₽ in the sketch). */
export type DevicePlatform = "ANDROID" | "WEB";

export interface RegisterDeviceRequest {
  userId: number;
  fcmToken: string;
  platform: DevicePlatform;
}

export interface PublishQuote {
  amount: number;
  currency: "RUB";
  label: string;
}

export interface ApiClient {
  events: {
    list(query?: EventListQuery): Promise<Page<EventItem>>;
    get(id: string): Promise<EventItem>;
    mine(scope: MyEventsScope, query?: EventListQuery): Promise<Page<EventItem>>;
    create(input: CreateEventInput): Promise<EventItem>;
    join(id: string): Promise<EventItem>;
    leave(id: string): Promise<EventItem>;
    publishQuote(): Promise<PublishQuote>;
    cancel(id: string): Promise<EventItem>;
    parseSearch(input: ParseSearchInput): Promise<SearchIntent>;
  };
  map: {
    pins(query?: EventListQuery): Promise<EventPin[]>;
  };
  chats: {
    list(): Promise<ChatSummary[]>;
    messages(eventId: string): Promise<ChatMessage[]>;
    send(eventId: string, text: string): Promise<ChatMessage>;
  };
  users: {
    me(): Promise<UserProfile>;
    updateMe(patch: Partial<UserProfile>): Promise<UserProfile>;
    setInterests(interests: ActivityId[]): Promise<UserProfile>;
  };
  tags: {
    list(): Promise<Tag[]>;
  };
}

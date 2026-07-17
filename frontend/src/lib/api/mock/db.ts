import { ACTIVITIES } from "@/lib/activities";
import type {
  ActivityId,
  ChatMessage,
  EventItem,
  Tag,
  UserProfile,
  UserSummary,
} from "@/lib/api/types";

/**
 * In-memory fixture database standing in for EventService/UserService.
 *
 * Mutations here are intentionally plain object edits — this module is the only
 * thing that dies when the real backend arrives, so it stays dumb on purpose.
 */

const MOSCOW = { lat: 55.7558, lng: 37.6173 };

/** Deterministic PRNG so the map/list look identical on every reload. */
function makeRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}
const rand = makeRandom(20260716);

function user(
  id: string,
  name: string,
  level: number,
  rating: number | null,
): UserSummary {
  return { id, name, avatarUrl: null, level, rating };
}

export const ME_ID = "u-me";

const USERS: UserSummary[] = [
  user(ME_ID, "Ега", 67, 4.9),
  user("u-roma", "Рома", 12, 4.6),
  user("u-misha", "Дядя Миша", 41, 4.8),
  user("u-java", "ДЖАВАГУРУ", 88, 5),
  user("u-katya", "Катя", 23, 4.7),
  user("u-oleg", "Олег", 5, null),
  user("u-nastya", "Настя", 34, 4.9),
  user("u-vlad", "Влад", 17, 4.2),
  user("u-sveta", "Света", 51, 4.95),
  user("u-timur", "Тимур", 9, 4.1),
];

const byId = (id: string) => USERS.find((u) => u.id === id)!;

export const profile: UserProfile = {
  ...byId(ME_ID),
  email: "egorkabercuk@gmail.com",
  city: "Москва",
  bio: "Играю в баскетбол по средам, пою по пятницам. Пишите — соберём компанию.",
  counts: { followers: 228, following: 67, events: 69 },
  interests: ["basketball", "karaoke", "boardgames", "coffee"],
  location: MOSCOW,
};

export const tags: Tag[] = [
  { id: "t-friendly", label: "Дружеский" },
  { id: "t-beginners", label: "Для новичков" },
  { id: "t-competitive", label: "Соревновательный" },
  { id: "t-outdoor", label: "На улице" },
  { id: "t-indoor", label: "В помещении" },
  { id: "t-free", label: "Бесплатно" },
  { id: "t-evening", label: "Вечер" },
  { id: "t-weekend", label: "Выходные" },
];

const tag = (id: string) => tags.find((t) => t.id === id)!;

const PLACES = [
  "Парк Горького",
  "Лужники",
  "Сокольники",
  "ВДНХ",
  "Патриаршие пруды",
  "Красный Октябрь",
  "Хамовники",
  "Измайловский парк",
  "Воробьёвы горы",
  "Китай-город",
  "Дизайн-завод Флакон",
  "Зарядье",
];

const TITLES: Partial<Record<ActivityId, string[]>> = {
  basketball: ["Баскетбол 3х3", "Стритбол вечером", "Утренний баскет"],
  football: ["Футбол 5х5", "Дворовый футбол"],
  volleyball: ["Пляжный волейбол", "Волейбол в зале"],
  boxing: ["Спарринг для новичков"],
  skating: ["Каток на ВДНХ"],
  tennis: ["Теннис, ищу пару", "Большой теннис утром"],
  cycling: ["Велопрогулка по набережной", "Хобби в 12:00"],
  baseball: ["Бейсбол в парке"],
  bowling: ["Боулинг после работы", "Хобби 30.04"],
  karaoke: ["КАРАОКЕ ПЕПЕШНЕЛЕ", "Караоке-пятница"],
  gaming: ["Turbo-турнир по FIFA", "Ретро-приставки"],
  art: ["Скетчинг в парке", "Рисуем гуашью"],
  crafts: ["Вяжем и болтаем"],
  boardgames: ["Настолки до полуночи", "Мафия для новичков"],
  coffee: ["Кофе и знакомства", "Утренний кофе"],
  bar: ["Бар-хоппинг", "Пятничные бокалы"],
  party: ["Дискотека 2000-х"],
  theatre: ["Поход в театр"],
  support: ["Группа поддержки"],
};

const DESCRIPTIONS: Partial<Record<ActivityId, string>> = {
  basketball:
    "Дружеский матч 3х3, без судей, играем для удовольствия и поддержки формы.",
  karaoke:
    "Субботний вечер в компании друзей. Поём любимые хиты 90-х и 2000-х, берём самые вкусные коктейли и просто отлично проводим время. Приходи, если любишь петь и веселиться!",
  football: "Играем 5х5 на резине. Форма любая, главное — настрой.",
  coffee: "Просто кофе и разговоры. Без повестки, приходите знакомиться.",
  boardgames: "Каталан, Codenames, Мафия. Всё своё, ничего брать не нужно.",
};

function describe(activityId: ActivityId): string {
  return (
    DESCRIPTIONS[activityId] ??
    "Собираемся небольшой компанией. Новичкам рады — приходите, будет интересно."
  );
}

function titleFor(activityId: ActivityId, i: number): string {
  const pool = TITLES[activityId];
  if (!pool?.length) return "Встреча";
  return pool[i % pool.length];
}

function scatter(): { lat: number; lng: number } {
  return {
    lat: MOSCOW.lat + (rand() - 0.5) * 0.14,
    lng: MOSCOW.lng + (rand() - 0.5) * 0.26,
  };
}

/** Nobody schedules football for 03:34 — snap to a plausible hour, 09:00–20:30. */
function startTime(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + Math.ceil(n / 3));
  d.setHours(9 + ((n * 5) % 12), (n % 2) * 30, 0, 0);
  return d;
}

/** Everyone except the current user; ME only joins where a fixture says so. */
const OTHERS = USERS.filter((u) => u.id !== ME_ID);

function buildEvents(): EventItem[] {
  const out: EventItem[] = [];
  let n = 0;

  for (const activity of ACTIVITIES) {
    const copies = activity.id === "karaoke" ? 2 : 1;
    for (let c = 0; c < copies; c++) {
      n += 1;
      const organizer = OTHERS[Math.floor(rand() * OTHERS.length)];
      const capacity = 4 + Math.floor(rand() * 4);
      const pool = OTHERS.filter((u) => u.id !== organizer.id);
      const taken = 1 + Math.floor(rand() * (capacity - 1));
      const starts = startTime(n);
      const ends = new Date(starts.getTime() + (2 + (n % 2)) * 3_600_000);
      const point = scatter();

      out.push({
        id: `e-${activity.id}-${c + 1}`,
        title: titleFor(activity.id, c),
        activityId: activity.id,
        description: describe(activity.id),
        startsAt: starts.toISOString(),
        endsAt: ends.toISOString(),
        location: { ...point, address: PLACES[n % PLACES.length] },
        organizer,
        participants: pool.slice(0, Math.min(taken, pool.length)),
        capacity,
        tags: [tag(rand() > 0.5 ? "t-friendly" : "t-beginners")].concat(
          rand() > 0.6 ? [tag("t-evening")] : [],
        ),
        isJoined: false, // Derived from `participants` once fixtures settle.
        rating: organizer.rating,
        status: "ACTIVE",
        cancelledAt: null,
      });
    }
  }
  return out;
}

export const events: EventItem[] = buildEvents();

/* --- Hand-tuned fixtures so the sketch's exact screens are reachable. ------ */

const karaoke = events.find((e) => e.id === "e-karaoke-1")!;
karaoke.title = "КАРАОКЕ ПЕПЕШНЕЛЕ";
karaoke.organizer = byId("u-java");
karaoke.capacity = 4;
karaoke.participants = [byId("u-roma"), byId("u-misha"), byId("u-katya")];
karaoke.rating = 4.9;
karaoke.location.address = "Красный Октябрь";

const basket = events.find((e) => e.id === "e-basketball-1")!;
basket.title = "Баскетбол 3х3";
basket.organizer = byId("u-oleg");
basket.capacity = 6;
basket.participants = [
  byId("u-roma"),
  byId("u-misha"),
  byId("u-katya"),
  byId("u-oleg"),
  byId(ME_ID),
];
basket.location.address = "Лужники";

// Organized by the current user, so "Мои события → Организую" isn't empty.
for (const id of ["e-boardgames-1", "e-coffee-1", "e-cycling-1"]) {
  const e = events.find((x) => x.id === id);
  if (!e) continue;
  e.organizer = byId(ME_ID);
  e.rating = profile.rating;
  if (!e.participants.some((p) => p.id === ME_ID)) {
    e.participants = [byId(ME_ID), ...e.participants].slice(0, e.capacity);
  }
}

// Joined but not organized, so "Участвую" isn't empty either.
for (const id of ["e-bowling-1", "e-gaming-1"]) {
  const e = events.find((x) => x.id === id);
  if (!e || e.participants.some((p) => p.id === ME_ID)) continue;
  if (e.participants.length >= e.capacity) e.capacity += 1;
  e.participants = [...e.participants, byId(ME_ID)];
}

/**
 * Single source of truth: membership is whether ME is in `participants`.
 * Setting `isJoined` by hand is what let the two drift apart.
 */
for (const e of events) {
  e.isJoined = e.participants.some((p) => p.id === ME_ID);
}

/* --- Chats: one per event the user is in. --------------------------------- */

let messageSeq = 0;
function message(
  eventId: string,
  authorId: string,
  text: string,
  minutesAgo: number,
): ChatMessage {
  messageSeq += 1;
  return {
    id: `m-${messageSeq}`,
    eventId,
    author: byId(authorId),
    text,
    sentAt: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
    isOwn: authorId === ME_ID,
  };
}

export const messages: ChatMessage[] = [
  message("e-cycling-1", "u-java", "Всем привет! Стартуем от Флакона", 10_200),
  message("e-cycling-1", "u-katya", "Буду минут на 10 позже", 10_150),
  message("e-cycling-1", ME_ID, "HELLO WORD", 10_080),

  message("e-basketball-1", "u-roma", "Мяч беру я", 300),
  message("e-basketball-1", "u-misha", "Отлично, я с водой", 240),
  message("e-basketball-1", ME_ID, "До встречи на Лужниках", 90),

  message("e-boardgames-1", "u-nastya", "Возьму Каркассон", 4_400),
  message("e-boardgames-1", ME_ID, "Беру Codenames и Мафию", 4_300),

  message("e-bowling-1", "u-vlad", "Дорожку забронировал на 20:00", 2_000),

  message("e-gaming-1", "u-timur", "Сетка турнира готова", 700),
  message("e-gaming-1", "u-sveta", "Кто ещё играет?", 660),
];

export const unread: Record<string, number> = {
  "e-basketball-1": 2,
  "e-gaming-1": 1,
};

export function pushMessage(m: ChatMessage) {
  messages.push(m);
}

export function nextMessageId(): string {
  messageSeq += 1;
  return `m-${messageSeq}`;
}

export function currentUser(): UserSummary {
  return byId(ME_ID);
}

export function setProfile(patch: Partial<UserProfile>) {
  Object.assign(profile, patch);
  const summary = byId(ME_ID);
  if (patch.name) summary.name = patch.name;
}

#!/usr/bin/env node
/**
 * Заполняет БД EventService тестовыми ивентами — те же данные, что во фронтовых моках.
 *
 * Запуск (из backend/eventservice):
 *   node scripts/seed-events.mjs
 *
 * Переменные окружения (опционально):
 *   PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE
 */
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PG = {
  host: process.env.PGHOST ?? "localhost",
  port: process.env.PGPORT ?? "5432",
  user: process.env.PGUSER ?? "hobbybobby",
  password: process.env.PGPASSWORD ?? "hobbybobby",
  database: process.env.PGDATABASE ?? "eventservice",
};

/** Текущий пользователь фронта (u-me) → user id=1 в UserService. */
const ME_ID = 1;

const MOSCOW = { lat: 55.7558, lng: 37.6173 };

const ACTIVITIES = [
  "basketball", "football", "volleyball", "boxing", "skating", "tennis",
  "cycling", "baseball", "bowling", "karaoke", "gaming", "art", "crafts",
  "boardgames", "coffee", "bar", "party", "theatre", "support",
];

const PLACES = [
  "Парк Горького", "Лужники", "Сокольники", "ВДНХ", "Патриаршие пруды",
  "Красный Октябрь", "Хамовники", "Измайловский парк", "Воробьёвы горы",
  "Китай-город", "Дизайн-завод Флакон", "Зарядье",
];

const TITLES = {
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

const DESCRIPTIONS = {
  basketball:
    "Дружеский матч 3х3, без судей, играем для удовольствия и поддержки формы.",
  karaoke:
    "Субботний вечер в компании друзей. Поём любимые хиты 90-х и 2000-х, берём самые вкусные коктейли и просто отлично проводим время. Приходи, если любишь петь и веселиться!",
  football: "Играем 5х5 на резине. Форма любая, главное — настрой.",
  coffee: "Просто кофе и разговоры. Без повестки, приходите знакомиться.",
  boardgames: "Каталан, Codenames, Мафия. Всё своё, ничего брать не нужно.",
};

const OTHERS = [2, 3, 4, 5, 6, 7, 8, 9, 10];

function makeRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const rand = makeRandom(20260716);

function describe(activityId) {
  return (
    DESCRIPTIONS[activityId] ??
    "Собираемся небольшой компанией. Новичкам рады — приходите, будет интересно."
  );
}

function titleFor(activityId, i) {
  const pool = TITLES[activityId];
  if (!pool?.length) return "Встреча";
  return pool[i % pool.length];
}

function scatter() {
  return {
    lat: MOSCOW.lat + (rand() - 0.5) * 0.14,
    lng: MOSCOW.lng + (rand() - 0.5) * 0.26,
  };
}

function startTime(n) {
  const d = new Date();
  d.setDate(d.getDate() + Math.ceil(n / 3));
  d.setHours(9 + ((n * 5) % 12), (n % 2) * 30, 0, 0);
  return d;
}

function buildEvents() {
  const out = [];
  let n = 0;

  for (const activityId of ACTIVITIES) {
    const copies = activityId === "karaoke" ? 2 : 1;
    for (let c = 0; c < copies; c++) {
      n += 1;
      const organizer = OTHERS[Math.floor(rand() * OTHERS.length)];
      const capacity = 4 + Math.floor(rand() * 4);
      const pool = OTHERS.filter((id) => id !== organizer);
      const taken = 1 + Math.floor(rand() * (capacity - 1));
      const starts = startTime(n);
      const ends = new Date(starts.getTime() + (2 + (n % 2)) * 3_600_000);
      const point = scatter();
      const tagMain = rand() > 0.5 ? "t-friendly" : "t-beginners";
      const tags = [tagMain];
      if (rand() > 0.6) tags.push("t-evening");

      out.push({
        id: `e-${activityId}-${c + 1}`,
        title: titleFor(activityId, c),
        activityId,
        description: describe(activityId),
        startsAt: starts.toISOString(),
        endsAt: ends.toISOString(),
        lat: point.lat,
        lng: point.lng,
        address: PLACES[n % PLACES.length],
        organizerId: organizer,
        participantIds: pool.slice(0, Math.min(taken, pool.length)),
        capacity,
        tagIds: tags,
        rating: null,
      });
    }
  }
  return out;
}

const events = buildEvents();

function find(id) {
  const e = events.find((x) => x.id === id);
  if (!e) throw new Error(`Event not found: ${id}`);
  return e;
}

// Ручные фикстуры как во фронтовом mock/db.ts
const karaoke = find("e-karaoke-1");
karaoke.title = "КАРАОКЕ ПЕПЕШНЕЛЕ";
karaoke.organizerId = 7;
karaoke.capacity = 4;
karaoke.participantIds = [2, 3, 4];
karaoke.rating = 4.9;
karaoke.address = "Красный Октябрь";

const basket = find("e-basketball-1");
basket.title = "Баскетбол 3х3";
basket.organizerId = 5;
basket.capacity = 6;
basket.participantIds = [2, 3, 4, 5, ME_ID];
basket.address = "Лужники";

for (const id of ["e-boardgames-1", "e-coffee-1", "e-cycling-1"]) {
  const e = find(id);
  e.organizerId = ME_ID;
  e.rating = 4.9;
  if (!e.participantIds.includes(ME_ID)) {
    e.participantIds = [ME_ID, ...e.participantIds].slice(0, e.capacity);
  }
}

for (const id of ["e-bowling-1", "e-gaming-1"]) {
  const e = find(id);
  if (!e.participantIds.includes(ME_ID)) {
    if (e.participantIds.length >= e.capacity) e.capacity += 1;
    e.participantIds = [...e.participantIds, ME_ID];
  }
}

function sqlEscape(value) {
  return String(value).replace(/'/g, "''");
}

function buildSql() {
  const lines = [
    "BEGIN;",
    "DELETE FROM chat_read_state;",
    "DELETE FROM chat_messages;",
    "DELETE FROM event_tags;",
    "DELETE FROM event_participants;",
    "DELETE FROM events;",
  ];

  for (const e of events) {
    const rating = e.rating != null ? e.rating : "NULL";
    lines.push(
      `INSERT INTO events (id, title, activity_id, organizer_id, description, starts_at, ends_at, lat, lng, address, capacity, rating) VALUES (` +
        `'${sqlEscape(e.id)}', '${sqlEscape(e.title)}', '${sqlEscape(e.activityId)}', ${e.organizerId}, ` +
        `'${sqlEscape(e.description)}', '${e.startsAt}'::timestamptz, '${e.endsAt}'::timestamptz, ` +
        `${e.lat}, ${e.lng}, '${sqlEscape(e.address)}', ${e.capacity}, ${rating}` +
        `);`,
    );

    const participantSet = new Set(e.participantIds);
    for (const userId of participantSet) {
      lines.push(
        `INSERT INTO event_participants (event_id, user_id) VALUES ('${e.id}', ${userId});`,
      );
    }

    for (const tagId of e.tagIds) {
      lines.push(
        `INSERT INTO event_tags (event_id, tag_id) VALUES ('${e.id}', '${tagId}');`,
      );
    }
  }

  const messages = [
    ["e-cycling-1", 7, "Всем привет! Стартуем от Флакона", "10 days"],
    ["e-cycling-1", 4, "Буду минут на 10 позже", "9 days"],
    ["e-cycling-1", ME_ID, "HELLO WORD", "8 days"],
    ["e-basketball-1", 5, "Мяч беру я", "5 hours"],
    ["e-basketball-1", 3, "Отлично, я с водой", "4 hours"],
    ["e-basketball-1", ME_ID, "До встречи на Лужниках", "90 minutes"],
    ["e-boardgames-1", 8, "Возьму Каркассон", "3 days"],
    ["e-boardgames-1", ME_ID, "Беру Codenames и Мафию", "2 days"],
    ["e-bowling-1", 9, "Дорожку забронировал на 20:00", "1 day"],
    ["e-gaming-1", 6, "Сетка турнира готова", "12 hours"],
    ["e-gaming-1", 10, "Кто ещё играет?", "11 hours"],
  ];

  let msgSeq = 0;
  for (const [eventId, authorId, text, ago] of messages) {
    msgSeq += 1;
    const id = `11111111-1111-1111-1111-${String(msgSeq).padStart(12, "0")}`;
    lines.push(
      `INSERT INTO chat_messages (id, event_id, author_id, text, created_at) VALUES (` +
        `'${id}', '${eventId}', ${authorId}, '${sqlEscape(text)}', NOW() - INTERVAL '${ago}'` +
        `);`,
    );
  }

  lines.push("COMMIT;");
  return lines.join("\n");
}

function runPsql(sql) {
  const env = { ...process.env, PGPASSWORD: PG.password };
  try {
    execFileSync(
      "psql",
      [
        "-h", PG.host,
        "-p", PG.port,
        "-U", PG.user,
        "-d", PG.database,
        "-v", "ON_ERROR_STOP=1",
        "-f", "-",
      ],
      { input: sql, env, stdio: ["pipe", "inherit", "inherit"] },
    );
    return;
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }

  const composeFile = path.resolve(__dirname, "../../docker-compose.yml");
  execFileSync(
    "docker",
    [
      "compose",
      "-f",
      composeFile,
      "exec",
      "-T",
      "postgres",
      "psql",
      "-U",
      PG.user,
      "-d",
      PG.database,
      "-v",
      "ON_ERROR_STOP=1",
      "-f",
      "-",
    ],
    { input: sql, env, stdio: ["pipe", "inherit", "inherit"] },
  );
}

const sql = buildSql();
console.log(`Seeding ${events.length} events into ${PG.database}@${PG.host}...`);
runPsql(sql);
console.log("Done.");

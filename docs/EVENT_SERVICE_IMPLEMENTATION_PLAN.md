# Event Service — план реализации

Рабочий план разработки бэкенда и подключения фронта.  
**Требования продукта** — в [EVENTS_SERVICE_MVP.md](./EVENTS_SERVICE_MVP.md).  
**Контракт DTO** — [frontend/src/lib/api/types.ts](../frontend/src/lib/api/types.ts).

*Обновлено: 2026-07-18 (gateway + Keycloak; X-User-Id = domain Long)*

---

## 1. Архитектура монорепо

```
backend/
  gateway/            — Spring Cloud Gateway MVC, JWT resource server   :9000
  eventservice/       — ивенты, теги, карта, чат, Kafka producer       :9011
  userservice/        — пользователи, интересы                          :9002
  realtime-service/   — WebSocket push (Kafka consumer)                 :9003
  chat-contract/      — общие Kafka DTO (composite build)
  keycloak/realm/     — realm hobbybobby (import при старте Keycloak)
  docker-compose.yml  — Postgres :5433, Kafka :9092, Keycloak :8080
  postgres/init/      — CREATE DATABASE eventservice, userservice

frontend/             — Next.js PWA; HTTP-клиенты в lib/api/http/
```

Стек: **Java 25**, **Spring Boot 4.1**, **Gradle 9.5.1**, **Postgres 17**, **Liquibase**, **Kafka**, **Keycloak 26**.

### Аутентификация

```
Клиент  --Bearer JWT-->  Gateway :9000  --X-User-Id (Long)-->  eventservice / userservice
                              |
                         Keycloak :8080  (issuer realm hobbybobby)
```

- Снаружи: `GET/POST http://localhost:9000/api/...` + `Authorization: Bearer <access_token>`.
- Gateway rewrite: `/api/**` → `/eventservice/api/**` или `/userservice/api/**`.
- Downstream по-прежнему ждут **`X-User-Id: <Long>`** (= `users.id`), не Keycloak `sub` (UUID).
- Резолв id (`resolveUserId`): claim `hobbybobby_user_id` → map `gateway.identity.user-id-by-username` (`demo` → `1`) → numeric `sub`.
- Фильтр `UserContextBeforeFilter` (`apply`) пишет заголовки в `ServerRequest` (иначе proxy MVC их не прокидывал).
- Demo: пользователь Keycloak `demo`/`demo`, client `hobbybobby-cli` или `hobbybobby-pwa`.

---

## 2. Статус реализации

### 2.1 EventService (`backend/eventservice`)

| Функция | UI (эскиз) | API | Статус |
|---|---|---|---|
| Список ивентов + пагинация (10) | Экран «Ивенты» | `GET /eventservice/api/events` | ✅ |
| Фильтр по типу активности | Чипы 🏀⚽… | `activityIds` | ✅ |
| Текстовый поиск | «Поиск по ивентам» | `query` → Postgres FTS (`search_vector`) | ✅ |
| Фильтр по тегам / дате / гео | — | `tagIds`, `from`, `to`, `nearLat/Lng`, `radiusKm` | ✅ |
| Детали ивента | Карточка + экран `[id]` | `GET /events/{id}` | ✅ |
| Создание ивента | Мастер «Создать» | `POST /events` | ✅ |
| Участвовать / выйти | Кнопка «Участвовать» / «Отменить» | `POST /events/{id}/join`, `/leave` | ✅ |
| Leave организатора | — | запрет `ORGANIZER_CANNOT_LEAVE` | ✅ |
| Отменить ивент (организатор) | «Отменить ивент» | `POST /events/{id}/cancel` → `CANCELLED` | ✅ |
| Мои ивенты | «Организую / Участвую» | `GET /events/mine?scope=` | ✅ |
| Котировка публикации | Экран «50 ₽» | `GET /events/publish-quote` | ✅ |
| Теги | Чипы на деталях | `GET /eventservice/api/tags` | ✅ |
| Пины карты | Таб «Карта» | `GET /eventservice/api/map/pins` | ✅ |
| Чат: список | Таб «Чаты» | `GET /eventservice/api/chats` | ✅ |
| Чат: сообщения / отправка | Экран чата | `GET/POST .../chats/{eventId}/messages` | ✅ |
| Kafka → realtime push | WS в чате | `ChatMessageProducer` | ✅ |
| Обогащение author/participants | «Создал(а): Рома», LVL | `UserServiceClient` batch | ✅ |
| Редактирование ивента | Экран edit | `PUT /events/{id}` (организатор) | ✅ |
| Удаление ивента | — | — | ❌ |
| Платная публикация (реальный платёж) | Оплата 50 ₽ | заглушка `publishQuote` | ❌ |
| Новостная лента (ранжирование) | — | отдельный `/feed` | ❌ |
| Postgres FTS (`tsvector`) | — | `008-add-event-search-vector` + GIN | ✅ |
| NL / умный поиск | «седня футбик в москоу» | `POST /events/search/parse` + filters | ✅ |

**Правило `isJoined`:** сервер вычисляет по наличию текущего пользователя в `participants` — не хранить отдельным флагом.

**Leave vs cancel:**
- `leave` — участник выходит из ивента; организатору запрещено (`ORGANIZER_CANNOT_LEAVE`).
- `cancel` — организатор отменяет проведение; `status=CANCELLED`, `cancelledAt` задаётся.

**Нормализация DTO на фронте:** `normalizeEvent` в `http/events.ts` подставляет дефолты (`tags`/`participants`/`rating`/`cancelledAt`/`status`), если бэк опустил поля из‑за `JsonInclude.NON_NULL`.

### 2.2 UserService (`backend/userservice`)

| Функция | Статус |
|---|---|
| CRUD пользователей | ✅ |
| Поиск по email | ✅ |
| Batch `findByIds` (для EventService) | ✅ |
| Интересы пользователя | ✅ |
| JWT / OAuth / Keycloak | 🟡 IdP + gateway есть; userservice ещё без keycloak_sub |

### 2.3 Realtime Service (`backend/realtime-service`)

| Функция | Статус |
|---|---|
| Kafka consumer `chat.message.created` | ✅ |
| WebSocket push участникам | ✅ |

### 2.4 Frontend

| Функция | Статус |
|---|---|
| UI по эскизу (5 табов, моки) | ✅ |
| HTTP-клиенты events/users/chats | ✅ |
| Переключение моков через env | ✅ |
| `X-User-Id` через `stores/auth` (прямой :9011) | ✅ |
| Bearer через gateway `:9000` | 🟡 бэк готов; фронт ещё на прямом URL / DEV user id |
| Полный E2E без моков | 🟡 API OK; UI — ручной прогон в браузере |

### 2.5 Инфраструктура

| Компонент | Статус |
|---|---|
| Docker Compose: Postgres + Kafka + Keycloak | ✅ |
| API Gateway (`backend/gateway`) | ✅ |
| NotificationService | ❌ |

---

## 3. Соответствие UI → API

### Экран «Ивенты» (список)

```
Поиск по ивентам          →  GET /events?query=...
[Все] [🏀 Баскетбол] …    →  GET /events?activityIds=basketball,...
Карточка 3/5, автор, ⭐    →  EventResponse (participants, organizer, rating)
[Участвовать] / [Отменить] →  isJoined + POST join/leave
                              (leave организатору запрещён)
```

### Экран деталей

```
Тип, теги, описание       →  activityId, tags[], description
Дата, 📍 место            →  startsAt, endsAt, location
Организатор LVL ⭐        →  organizer (UserSummary из UserService)
Участники 3/4             →  participants[], capacity
Отменить ивент            →  POST /events/{id}/cancel (только организатор)
```

Базовый URL (через gateway): `http://localhost:9000/api` + Bearer JWT.  
Прямой (dev): `http://localhost:9011/eventservice/api` + `X-User-Id: <Long>`.  
Контракт ответов — `EventItem`, `Page<EventItem>`, `EventPin`, `Tag` в `types.ts`.

---

## 4. Модель данных (Postgres)

Основные таблицы (Liquibase `backend/eventservice/src/main/resources/db/changelog/`):

- `events` — ивент (title, activity_id, description, starts_at, ends_at, lat/lng, address, capacity, organizer_id)
- `event_participants` — участники (составной PK event_id + user_id)
- `event_tags`, `tags` — теги
- `chat_messages`, `chat_read_state` — чат

Типы активности (`activity_id`) — 19 значений из `frontend/src/lib/activities.ts` (`basketball`, `football`, …). Emoji и category — только на фронте.

UserService хранит пользователей отдельно в БД `userservice`; EventService хранит только `organizer_id` / `user_id` и обогащает через REST.

---

## 5. Фазы (дорожная карта)

### Фаза 0 — Каркас ✅

- [x] Spring Boot, Flyway/Liquibase, Docker Postgres + Kafka
- [x] Gradle wrapper 9.5.1, Java 25
- [x] `chat-contract` + `includeBuild`
- [x] Заглушка auth: `X-User-Id`

### Фаза 1 — Ядро ивентов ✅

- [x] CRUD создание + список + детали
- [x] join / leave
- [x] mine (organizing / participating)
- [x] seed-скрипты (`scripts/seed-events.sh`, `.mjs`)
- [x] Интеграция UserService

### Фаза 2 — Фильтры и карта ✅

- [x] Фильтры activityIds, tagIds, дата, гео
- [x] Map pins
- [x] Справочник тегов

### Фаза 3 — Чат ✅

- [x] REST чат в EventService
- [x] Kafka producer
- [x] realtime-service WebSocket

### Фаза 4 — Фронт ↔ бэк ✅ (API)

- [x] `httpEventsClient`, `httpUsersClient`, `httpChatsClient`
- [x] Живой API: list/get/mine, join/leave, create, cancel, tags, pins, chats
- [x] `normalizeEvent` — дефолты для NON_NULL полей бэка
- [x] Leave организатора запрещён; отмена проведения — через `cancel`
- [ ] Ручной прогон UI в браузере (`npm run dev`, логин тестовым юзером)

### Фаза 5 — Доработки MVP

- [x] Редактирование ивента (организатор); удаление при необходимости — edit ✅
- [x] Postgres FTS вместо in-memory `matchesText` (база для NL-поиска)
- [ ] Новостная лента `/feed` (подписки + теги + гео)
- [x] JWT + Gateway / Keycloak (gateway ставит `X-User-Id`; фронт ещё может слать заголовок напрямую)
- [ ] Реальная оплата публикации
- [ ] NotificationService (push/email)
- [x] **Умный поиск (NL → фильтры)** — см. §11: правило-based intent, без LLM

### Фаза 6 — AI-поиск и персонализация

- [ ] LLM-парсер сложных запросов (fallback к правилам)
- [ ] Семантический / hybrid search (эмбеддинги + FTS)
- [ ] Персонализация: интересы профиля + история join
- [ ] Подсказки («Похоже, вы имели в виду…») и чипы разбора запроса

### Фаза 7 — Пост-MVP

- [ ] UserIntention, геопоиск людей на карте
- [ ] Follow-система, рейтинги, геймификация LVL
- [ ] Пользовательские типы активностей + модерация

---

## 6. Локальная разработка

### Запуск

```bash
cd backend
cp .env.example .env
docker compose up -d                    # Postgres :5433, Kafka :9092, Keycloak :8080

cd gateway && ./gradlew bootRun         # http://localhost:9000
cd eventservice && ./gradlew bootRun    # http://localhost:9011
cd userservice && ./gradlew bootRun     # http://localhost:9002
cd realtime-service && ./gradlew bootRun # http://localhost:9003

cd eventservice && ./scripts/seed-events.sh   # 20 тестовых ивентов
```

### Gateway + Keycloak — проверка

```bash
# токен
curl -s -X POST "http://localhost:8080/realms/hobbybobby/protocol/openid-connect/token" \
  -d "grant_type=password&client_id=hobbybobby-cli&username=demo&password=demo"

# без токена → 401
curl -s -o /dev/null -w "%{http_code}" http://localhost:9000/api/events?page=0&size=1

# с Bearer → 200 (X-User-Id=1 внутри)
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:9000/api/events?page=0&size=1"
```

Realm: `backend/keycloak/realm/hobbybobby-realm.json` (attribute `hobbybobby_user_id=1` + protocol mapper).  
Локальный fallback без переимпорта realm: `gateway.identity.user-id-by-username.demo: "1"` в `gateway/src/main/resources/application.yaml`.

**Важно:** `--import-realm` подхватывает JSON только при первом создании realm; чтобы обновить mapper/attribute — пересоздать контейнер Keycloak / volume или править в Admin UI.

### Порты и грабли (Windows)

| Проблема | Решение |
|---|---|
| Postgres auth failed на `5432` | Локальный `postgres.exe` конфликтует с Docker → Postgres в compose на **5433** |
| Port 9001 in use | `trantorAgent.exe` занимает 9001 → EventService на **9011** (`SERVER_PORT`) |
| Gateway 500 на `/api/events` | `X-User-Id` был UUID `sub`; нужен Long — `UserContextBeforeFilter` + map/claim |
| Gradle `major version 69` | IDE: Wrapper **9.5.1**, не bundled Gradle 8.5 |
| `gradle-wrapper.properties not found` | Открывать `backend/eventservice` (или `gateway`), не корень монорепо |
| `ChatMessageCreatedEvent` not found | Зависимость `chat-contract` + Gradle Sync |

### IntelliJ

- **Open:** `backend/eventservice` (или `userservice`, `realtime-service`, `gateway`, `chat-contract`)
- **Gradle distribution:** Wrapper
- **Gradle JVM:** JDK 25

### Фронт с живым бэком

`frontend/.env.local` (пока прямой eventservice + `X-User-Id` из `stores/auth`):

```env
NEXT_PUBLIC_USE_MOCK_EVENTS=false
NEXT_PUBLIC_USE_MOCK_USERS=false
NEXT_PUBLIC_USE_MOCK_CHATS=false
NEXT_PUBLIC_EVENT_API_URL=http://localhost:9011/eventservice/api
```

Через gateway (после подключения Bearer на фронте):

```env
NEXT_PUBLIC_EVENT_API_URL=http://localhost:9000/api
```

### Postgres FTS — как устроено и как проверить

**Миграция:** один changeset `008-add-event-search-vector.yaml`:

- колонка `events.search_vector` (`tsvector`)
- GIN-индекс `idx_events_search_vector`
- триггер на INSERT/UPDATE `title`, `description`, `address`, `activity_id`
- словарь синонимов/сленга активностей (`event_activity_search_text`: «футбик» → football, «кофейку бахнем» → coffee, …)

**Код:** `FullTextQueryBuilder` → `слово:* & слово:*`; `EventRepository.findIdsByFullText`; `EventService.applyFullTextSearch`.

#### Проверка

1. Поднять Postgres + EventService (`docker compose up -d`, затем `cd eventservice && ./gradlew bootRun`).
2. В логе старта — успешное применение `008-add-event-search-vector` (без checksum / SQL ошибок).
3. Если раньше локально гоняли черновые 009/010 и Liquibase ругается — сброс volume:

```bash
cd backend
docker compose down -v
docker compose up -d
cd eventservice && ./gradlew bootRun
./scripts/seed-events.sh   # при необходимости
```

4. **UI:** `http://localhost:3000/events` (моки выкл.) — строка поиска:

| Запрос | Ожидание |
|---|---|
| `футбол` / `футбик` | ивенты football |
| `кофейку бахнем` | ивенты coffee |
| `настолки` | boardgames |
| `парк` | совпадение в title/address/description |
| `абракадабраxyz` | пустой список |

5. **REST:**

```http
GET http://localhost:9011/eventservice/api/events?query=кофейку%20бахнем
X-User-Id: 1

GET http://localhost:9011/eventservice/api/events?query=футбик
X-User-Id: 1
```

6. **SQL** (порт Postgres на хосте — **5433**):

```bash
docker exec -it hobbybobby-postgres psql -U hobbybobby -d eventservice
```

```sql
\d events

SELECT id, title, activity_id
FROM events
WHERE search_vector @@ to_tsquery('simple', 'кофейку:* & бахнем:*');

SELECT id, title, activity_id
FROM events
WHERE search_vector @@ to_tsquery('simple', 'футбик:*');
```

#### Чеклист

- [ ] EventService стартовал без ошибки Liquibase по `008`
- [ ] `query=футбик` что-то находит
- [ ] `query=кофейку бахнем` находит coffee
- [ ] мусорный запрос — пустой `items`

**Не путать с NL-парсером (§11):** FTS ищет слова в индексе (включая сленг активностей). Даты («завтра») и гео («в москве») FTS сам не выставляет — для этого нужен intent-parser.

---

## 7. Kafka-события

| Топик | Producer | Consumer | Назначение |
|---|---|---|---|
| `chat.message.created` | EventService | realtime-service | Push в WebSocket |

Контракт: `org.javaguru.chat.kafka.ChatMessageCreatedEvent` в `chat-contract`.

---

## 8. Открытые вопросы

| # | Вопрос | Рекомендация на сейчас |
|---|---|---|
| 1 | FTS: Postgres vs Elasticsearch | ✅ Сделано: Postgres `tsvector` + GIN (`008`) |
| 2 | Рейтинг / LVL в карточке | Читать из UserService; рейтинг ивента = организатора |
| 3 | Платная публикация 50 ₽ | `publishQuote` — заглушка до платёжки |
| 4 | Формула ленты | Отложить до фазы 5 |
| 5 | JWT vs X-User-Id | ✅ Gateway + JWT; downstream всё ещё на Long `X-User-Id` |
| 6 | AI-поиск: LLM vs только правила | Сначала правила + словари (§11); LLM — фаза 6 |
| 7 | Город «Москва» без координат у ивента | Геокодинг адреса при create + таблица городов / bbox |

---

## 9. Пробелы плана (ревью полноты)

Что в плане было слабым или отсутствовало относительно спеки/кода:

| Пробел | Почему важно | Куда |
|---|---|---|
| NL / «умный» поиск | FTS закрывает сленг активностей; «седня/москоу» ещё нет | §11, фазы 5–6 |
| Поиск не в SQL | ✅ Закрыто: `search_vector` + GIN | §6 FTS |
| Edit/delete ивента | Edit ✅ (`PUT`); delete ещё нет | фаза 5 |
| Редактирование сообщений чата | В MVP есть, в API только send | бэклог чата |
| Геокодинг при создании | Адрес текстом, пин часто «центр Москвы» | фаза 5–6 |
| CORS / Gateway | Gateway :9000 готов; фронт ещё часто на :9011 | переключить URL + Bearer |
| Тесты контракта фронт↔бэк | DTO могут разъехаться | фаза 4 E2E |
| Observability | Нет метрик/трейсов в плане | прод-готовность |
| Capacity / EVENT_FULL UX | Есть на бэке, на фронте слабо описано | UI + i18n |
| Offline / PWA push | В MVP спеке, в плане не раскрыто | пост-MVP |

---

## 10. Следующие задачи (приоритет)

1. **UI E2E:** `cd frontend && npm run dev` — список / детали / join / create / cancel / edit.
2. **Фронт → gateway** — Bearer Keycloak, `NEXT_PUBLIC_EVENT_API_URL=:9000/api`, убрать ручной `X-User-Id`.
3. **Identity** — колонка/lookup `keycloak_sub` или стабильный claim вместо статичного map `demo→1`.
4. **CI** — сборка `eventservice` + `userservice` + `gateway` в pipeline.
5. **Удаление ивента / feed / оплата** — по бэклогу фазы 5.

---

## 11. Умный поиск ивентов (NL → фильтры)

Цель: запрос вроде **«найди седня или завтра футбик в москоу»** превращается в те же фильтры, что уже есть (`activityIds`, `from`/`to`, `near`/`radiusKm`, `query`), а не в «магический» поиск по сырой строке.

### 11.1 Почему текущий `query` не справляется

Пример: `седня или завтра футбик в москоу`

| Слово | Смысл | Сейчас |
|---|---|---|
| седня | сегодня | нет в title/description → отсекает всё |
| завтра | дата | не мапится в `from`/`to` |
| футбик | football | `activityId` = `football`, не подстрока |
| москоу | Москва | адрес/гео, не lat/lng фильтр |
| найди / или | шум | тоже ищутся как слова |

Нужен слой **intent parsing**, а не усиление `contains()`.

### 11.2 Рекомендуемая архитектура (3 уровня)

```
Пользователь: "седня или завтра футбик в москоу"
        │
        ▼
┌───────────────────────┐
│  SearchIntentParser   │  ← сначала правила, потом опционально LLM
└───────────┬───────────┘
            │ SearchIntent
            │  activityIds: [football]
            │  from: today 00:00
            │  to:   tomorrow 23:59
            │  near: Москва bbox / geo
            │  freeText: null
            ▼
┌───────────────────────┐
│  EventService.list()  │  ← уже существующие фильтры (+ FTS)
└───────────────────────┘
```

**Уровень A — правила (фаза 5, без LLM):** словари опечаток/сленга + дата/время + город.  
**Уровень B — LLM structured output (фаза 6):** JSON-схема `SearchIntent`, fallback к A при ошибке/таймауте.  
**Уровень C — семантика (фаза 6+):** эмбеддинги description/title + hybrid rank (FTS + vector).

Не начинать с LLM: для 19 `ActivityId` и дат/городов правила дешевле, быстрее и предсказуемее.

### 11.3 Контракт `SearchIntent`

```json
{
  "rawQuery": "найди седня или завтра футбик в москоу",
  "activityIds": ["football"],
  "from": "2026-07-17T00:00:00Z",
  "to": "2026-07-18T23:59:59Z",
  "near": { "lat": 55.75, "lng": 37.62 },
  "radiusKm": 25,
  "city": "Москва",
  "tagIds": [],
  "freeText": null,
  "interpretedAs": {
    "when": "сегодня или завтра",
    "what": "Футбол",
    "where": "Москва"
  },
  "confidence": 0.92
}
```

API (предложение):

| Метод | Назначение |
|---|---|
| `POST /eventservice/api/events/search/parse` | строка → `SearchIntent` (UI показывает чипы) |
| `GET /events?...` | как сейчас, но фронт шлёт уже разобранные params |
| или `POST /events/search` | parse + list в одном вызове |

На UI: после разбора показать чипы **«Футбол · Сегодня–завтра · Москва»** с возможностью снять фильтр — пользователь видит, что понял бот.

### 11.4 Словари уровня A (минимум для демо)

**Даты:** `сегодня|седня|сёдня|today` → `[now, endOfDay]`; `завтра` → next day; `на выходных` → ближайшие сб–вс; `вечером` → 18:00–23:59; `утром` → 06:00–12:00.

**Активности (синонимы → `ActivityId`):**

| activityId | Примеры |
|---|---|
| football | футбол, футбик, soccer, 5х5, фут |
| basketball | баскет, 3х3, стритбол |
| volleyball | волейбол, пляжный |
| bowling | боулинг |
| karaoke | караоке |
| coffee | кофе, кофейня |
| … | по всем 19 из `activities.ts` |

**Гео:** `москва|москоу|мск|moscow` → bbox/центр + `radiusKm` (по умолчанию 20–30); `рядом` → `near` из геолокации пользователя.

**Шум:** `найди`, `хочу`, `ищу`, `пожалуйста`, `или` (для дат — union диапазонов).

Опечатки: нормализация (`ё→е`), простой edit-distance ≤1 к словарю или `pg_trgm`.

### 11.5 Пример разбора

Ввод: `найди седня или завтра футбик в москоу`

1. Убрать шум: `седня или завтра футбик в москоу`
2. Даты: `седня` ∪ `завтра` → `from=сегодня 00:00`, `to=завтра 23:59`
3. Активность: `футбик` → `football`
4. Место: `москоу` → Москва, `near` + `radiusKm=25`
5. Вызов существующего `list(...)` — без LLM.

### 11.6 LLM (фаза 6) — когда правила не хватает

Сложные фразы: «что-нибудь спокойное вечером недалеко от Патриков», «ищу пару на теннис подешевле».

- Промпт: список `ActivityId` + тегов + «верни только JSON по схеме».
- Провайдер за абстракцией `SearchIntentParser` (OpenAI / локальная модель).
- Таймаут 800ms → fallback к правилам; кэш по нормализованной строке.
- Не отдавать LLM сырой SQL — только JSON intent.

### 11.7 Семантика / hybrid (фаза 6+)

- Колонка `embedding` (pgvector) по `title + description + activity + address`
- Rank: `α * fts_rank + β * vector_similarity + γ * geo_distance + δ * starts_at_proximity`
- Имеет смысл после FTS и стабильного каталога активностей

### 11.8 Фронт

1. Строка поиска как сейчас.
2. Debounce → `parse` → чипы интерпретации.
3. Список через обычный `list` с params из intent.
4. Placeholder: «сегодня футбол в Москве» (примеры в `ru.ts`).
5. Голос (опционально) → та же строка в parser.

### 11.9 Критерии готовности NL v1

- [ ] «завтра футбол» → только football на завтра
- [ ] «седня футбик в москоу» → football, сегодня–завтра или сегодня, Москва
- [ ] «караоке вечером» → karaoke + вечерний диапазон
- [ ] Чистый «ВДНХ» → freeText/address FTS без ложной активности
- [ ] Пустой/мусорный запрос → пустой intent, обычный list
- [ ] Парсер < 50ms (правила) или < 1s (LLM с fallback)

---

## 12. Ссылки

- [EVENTS_SERVICE_MVP.md](./EVENTS_SERVICE_MVP.md) — продуктовая спека
- [sketch.excalidraw](./sketch.excalidraw) — UI-эскиз (источник истины по интерфейсу)
- [frontend/AGENTS.md](../frontend/AGENTS.md) — стек и грабли фронта
- [backend/.env.example](../backend/.env.example) — переменные окружения
- [frontend/src/lib/activities.ts](../frontend/src/lib/activities.ts) — каталог `ActivityId` для словарей поиска

# HobbyBobby

Поиск людей по интересам и организация ивентов — спорт, хобби, встречи.
Монорепозиторий: фронт и микросервисы лежат отдельными папками верхнего
уровня.

## Структура

```
frontend/                  Next.js PWA — UI
backend/
  eventservice/            ивенты, теги, карта, чат          :9011
  userservice/             пользователи, интересы              :9002
  realtime-service/        WebSocket push (Kafka)              :9003
  gateway/                 API Gateway (JWT → X-User-Id)       :9000
  chat-contract/           общие Kafka DTO
  keycloak/realm/          realm hobbybobby
  docker-compose.yml       Postgres :5433, Kafka :9092, Keycloak :8080
docs/                      EVENTS_SERVICE_MVP.md, план, sketch.excalidraw
```

У каждой папки свой `.gitignore`, свои зависимости и свой цикл сборки —
общего рантайма между фронтом и сервисами нет.

## Быстрый старт (фронт)

```bash
cd frontend
npm install
npm run dev     # http://localhost:3000
```

## Быстрый старт (бэк + gateway)

```bash
cd backend
cp .env.example .env
docker compose up -d          # Postgres, Kafka, Keycloak

cd gateway && ./gradlew bootRun          # :9000
cd eventservice && ./gradlew bootRun     # :9011
cd userservice && ./gradlew bootRun      # :9002
```

Публичный вход для API: **`http://localhost:9000/api/...`** (Bearer JWT).
Demo-пользователь Keycloak: `demo` / `demo` (client `hobbybobby-cli`).
Gateway мапит его в `X-User-Id: 1` (userservice).

Подробности — [docs/EVENT_SERVICE_IMPLEMENTATION_PLAN.md](docs/EVENT_SERVICE_IMPLEMENTATION_PLAN.md).

## Статус

| Часть | Состояние |
|---|---|
| **frontend** | UI по эскизу; моки или HTTP через env |
| **eventservice** | MVP API (ивенты, FTS, NL-parse, чат, join/leave/cancel/edit) |
| **userservice** | Пользователи, интересы, batch by-ids |
| **realtime-service** | Kafka → WebSocket |
| **gateway + Keycloak** | JWT resource server; прокидка `X-User-Id` |
| **notification-service** | В работе / отдельно |

## Как подключить сервис к фронту

Контракт DTO — [frontend/src/lib/api/types.ts](frontend/src/lib/api/types.ts).
Точка подключения — [frontend/src/lib/api/client.ts](frontend/src/lib/api/client.ts).
Для живого API через gateway: `NEXT_PUBLIC_EVENT_API_URL=http://localhost:9000/api`
(+ Bearer; пока фронт ещё может ходить на `:9011` с заголовком `X-User-Id`).

## Деплой

Фронт на Vercel: **Root Directory = `frontend`**.

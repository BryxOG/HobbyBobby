<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# HobbyBobby — frontend

Next.js PWA: весь UI приложения. Бэка ещё нет, данные — моки за типизированным
контрактом.

Это папка монорепо. Общие правила — в корневом `../AGENTS.md`.
**Все команды ниже запускать из `frontend/`, не из корня репо.**

## Команды

```bash
npm run dev        # http://localhost:3000
npm run build      # прод-сборка
npm run typecheck  # tsc --noEmit
npm run lint       # eslint (правила react-compiler строгие)
npm run icons      # перегенерировать PWA-иконки
```

## Стек

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind v4 ·
Yandex Maps JS API v3 (ключ в `NEXT_PUBLIC_YANDEX_MAPS_API_KEY`) · TanStack
Query · Zustand · PWA со своим service worker.

## Источник истины по UI

Эскиз `../docs/sketch.excalidraw` (34 экрана, светлая и тёмная темы) плюс спека
`../docs/EVENTS_SERVICE_MVP.md`. Где расходятся — эскиз главнее:
в спеке нижняя навигация описана как «Главная/Карта, Чаты, Создать,
Поиск/компас, Профиль», но стрелки эскиза ведут в **Ивенты, Чаты, Создать(+),
Карта, Профиль**. Сделано по стрелкам. Палитра (`globals.css`) снята из
эскиза: зелёный `#2f9e44` — «Участвовать», красный `#e03131` — «Отменить»,
синий `#228be6` — публикация и свои сообщения.

## Структура

```
src/
  app/(tabs)/          пять табов; layout вешает TabBar
    events/            список → [id] детали
    chats/             список → [id] чат
    create/            мастер: тип → details → publish → done
    map/               Yandex Maps + пины
    menu/              profile / my-events / interests / settings
  lib/
    api/types.ts       ← ДОМЕННЫЙ КОНТРАКТ. Под него равнять DTO сервисов.
    api/client.ts      ← ЕДИНСТВЕННАЯ ТОЧКА ЗАМЕНЫ МОКОВ НА HTTP
    api/mock/          in-memory фикстуры (db.ts) + реализация ApiClient
    api/hooks.ts       TanStack Query поверх контракта
    i18n/ru.ts         ВСЕ пользовательские строки; хардкод в JSX — нет
    stores/            zustand: settings (persist), draft (мастер создания)
  components/ui/       примитивы в духе iOS
```

### Подключение бэкенда

Написать `httpClient: ApiClient` против `NEXT_PUBLIC_API_URL` и поменять одну
строку в `lib/api/client.ts`. Экраны и хуки не трогаются.

## Грабли (проверено на практике)

- **`isJoined` — производное.** Источник истины — есть ли текущий юзер в
  `participants`. Не выставлять отдельно: именно так счётчик и кнопка
  разъехались («Участвовать» при том, что юзер уже в списке).
- **Пагинация — 10**, зафиксировано спекой (`mock/index.ts`).
- **setState внутри effect запрещён линтом** (React Compiler). Выводить
  значение при рендере, а не зеркалить эффектом.
- **Мастер создания:** не звать `reset()` перед `router.push()` — гард на
  `/create/done` увидит пустой `publishedId` и вернёт на `/create`. Черновик
  чистится при следующем входе в `/create`.
- **Иконки:** `src/app/icon.png` и `src/app/apple-icon.png` — файловые
  соглашения Next. В `public/` они молча игнорируются, и iOS ставит на
  домашний экран скриншот вместо иконки.
- **Моки живут в памяти модуля** — полная перезагрузка страницы сбрасывает
  созданные ивенты и отправленные сообщения. Так и задумано.
- **Тема** переключается вручную (☀️/🌙), не по `prefers-color-scheme`.
  `ThemeScript` в `<head>` применяет её до первой отрисовки — не удалять,
  иначе тёмная тема будет мигать белым.
- **Serwist не используем:** это webpack-плагин, а Next 16 по умолчанию на
  Turbopack. SW написан руками (`public/sw.js`), без precache-манифеста —
  ассеты Next и так хешированные, кешируются при первом обращении.

## Не сделано (ждёт бэка)

Аутентификация (JWT + OAuth), геокодинг адреса при создании (пин пока в центр
Москвы), реальные платежи (50 ₽ приходит из `publishQuote()`), push,
follow-система, ранжирование ленты.

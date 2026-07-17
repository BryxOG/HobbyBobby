# notification-service

Push-уведомления через Firebase Cloud Messaging.

## Запуск

```bash
cd backend && docker compose up -d
cd notification-service && ./gradlew bootRun   # http://localhost:9004
```

Переменные окружения — см. `backend/.env.example`.

## API

- `POST /notificationservice/api/devices` — регистрация FCM-токена
- `DELETE /notificationservice/api/devices` — удаление токена

## Kafka

- `event.reminder.due` — напоминание за час до ивента
- `event.cancelled` — ивент отменён

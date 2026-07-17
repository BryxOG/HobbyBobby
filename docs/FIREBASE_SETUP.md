# Подключение Firebase Cloud Messaging (FCM)

Инструкция для HobbyBobby: push-уведомления об ивентах (напоминание за час и отмена).

## 1. Firebase Console

1. Откройте [Firebase Console](https://console.firebase.google.com).
2. **Add project** → укажите имя (например `hobbybobby`).
3. Cloud Messaging включён по умолчанию.

## 2. Service Account (backend)

Нужен для `notification-service` (Firebase Admin SDK).

1. Project Settings → **Service accounts**.
2. **Generate new private key** → скачайте JSON.
3. Сохраните файл **вне репозитория** (не коммитьте).
4. В `backend/.env`:

```env
FIREBASE_SERVICE_ACCOUNT_PATH=/absolute/path/to/serviceAccountKey.json
```

Альтернатива для Docker/CI — inline JSON:

```env
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

Для локальной разработки без Firebase:

```env
FIREBASE_ENABLED=false
```

## 3. Web / PWA (Android Chrome)

### 3.1. Регистрация Web App

1. Project Settings → **Add app** → **Web** (`</>`).
2. Скопируйте `firebaseConfig`.
3. Project Settings → **Cloud Messaging** → **Web Push certificates** → **Generate key pair** (VAPID).

### 3.2. Переменные фронта

В `frontend/.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=....firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_VAPID_KEY=...
NEXT_PUBLIC_NOTIFICATION_API_URL=http://localhost:9004/notificationservice/api
```

### 3.3. Service Worker

Обновите `frontend/public/firebase-messaging-sw.js` — подставьте те же значения `firebaseConfig`, что и в Console.

### 3.4. Регистрация токена

1. Запустите `notification-service` и войдите в приложение.
2. Профиль → Настройки → включите **Уведомления**.
3. Браузер запросит разрешение → токен отправится в `POST /notificationservice/api/devices`.

## 4. Нативное Android-приложение

### 4.1. Регистрация Android App

1. Firebase Console → **Add app** → **Android**.
2. Package name, например `org.javaguru.hobbybobby`.
3. Скачайте `google-services.json` → `app/`.

### 4.2. Gradle

`build.gradle` (project):

```gradle
plugins {
    id 'com.google.gms.google-services' version '4.4.2' apply false
}
```

`app/build.gradle`:

```gradle
plugins {
    id 'com.android.application'
    id 'com.google.gms.google-services'
}

dependencies {
    implementation platform('com.google.firebase:firebase-bom:33.12.0')
    implementation 'com.google.firebase:firebase-messaging'
}
```

### 4.3. Получение FCM-токена

```kotlin
FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
    if (!task.isSuccessful) return@addOnCompleteListener
    val token = task.result
    // POST http://localhost:9004/notificationservice/api/devices
    // { "userId": 1, "fcmToken": token, "platform": "ANDROID" }
}
```

Переопределяйте токен в `FirebaseMessagingService.onNewToken()`.

### 4.4. Обработка push

```kotlin
override fun onMessageReceived(message: RemoteMessage) {
    val type = message.data["type"]
    val eventId = message.data["eventId"]
    // EVENT_REMINDER / EVENT_CANCELLED → открыть экран ивента
}
```

## 5. Запуск и проверка

```bash
cd backend && docker compose up -d
cd eventservice && ./gradlew bootRun          # :9001
cd notification-service && ./gradlew bootRun   # :9004
cd frontend && npm run dev                   # :3000
```

### Напоминание за час

1. Создайте ивент с `startsAt` ≈ `now + 61 мин`.
2. Зарегистрируйте FCM-токен.
3. Дождитесь cron в EventService (каждую минуту) → Kafka `event.reminder.due` → push.

### Отмена ивента

```http
POST http://localhost:9001/eventservice/api/events/{eventId}/cancel
X-User-Id: {organizerId}
```

Участники получат push из топика `event.cancelled`.

## 6. Kafka-топики

| Топик | Продюсер | Консьюмер |
|-------|----------|-----------|
| `event.reminder.due` | EventService (scheduler) | notification-service |
| `event.cancelled` | EventService (cancel API) | notification-service |

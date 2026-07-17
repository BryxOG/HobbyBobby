import { httpNotificationsClient } from "@/lib/api/http/notifications";

/** Конфигурация Firebase Web App из env. */
function firebaseConfig() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
  if (!apiKey || !projectId || !messagingSenderId || !appId) {
    return null;
  }
  return {
    apiKey,
    authDomain,
    projectId,
    messagingSenderId,
    appId,
  };
}

let cachedToken: string | null = null;

/**
 * Запрашивает разрешение и регистрирует Web Push токен в notification-service.
 *
 * @param userId идентификатор текущего пользователя
 * @returns FCM-токен или null, если push недоступен
 */
export async function enableWebPush(userId: string): Promise<string | null> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return null;
  }
  const config = firebaseConfig();
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!config || !vapidKey) {
    console.warn("Firebase env не задан — push пропущен");
    return null;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return null;
  }

  const { initializeApp, getApps } = await import("firebase/app");
  const { getMessaging, getToken, isSupported } = await import("firebase/messaging");

  if (!(await isSupported())) {
    return null;
  }

  const app = getApps().length ? getApps()[0] : initializeApp(config);
  const messaging = getMessaging(app);
  const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: registration,
  });

  if (!token) {
    return null;
  }

  await httpNotificationsClient.registerDevice({
    userId: Number(userId),
    fcmToken: token,
    platform: "WEB",
  });
  cachedToken = token;
  return token;
}

/**
 * Удаляет зарегистрированный Web Push токен.
 *
 * @param userId идентификатор текущего пользователя
 */
export async function disableWebPush(userId: string): Promise<void> {
  if (!cachedToken) {
    return;
  }
  await httpNotificationsClient.unregisterDevice(Number(userId), cachedToken);
  cachedToken = null;
}

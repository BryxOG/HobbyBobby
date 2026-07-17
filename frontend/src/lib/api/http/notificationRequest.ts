import { getAuthUserId } from "@/lib/stores/auth";

/** Базовый URL notification-service без завершающего слеша. */
export const NOTIFICATION_API_BASE =
  process.env.NEXT_PUBLIC_NOTIFICATION_API_URL ??
  "http://localhost:9004/notificationservice/api";

/**
 * Выполняет HTTP-запрос к notification-service.
 *
 * @param path путь относительно NOTIFICATION_API_BASE
 * @param init параметры fetch
 */
export async function notificationRequest(
  path: string,
  init?: RequestInit,
): Promise<void> {
  const response = await fetch(`${NOTIFICATION_API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const body = (await response.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
}

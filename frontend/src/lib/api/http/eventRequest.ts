import { getAuthUserId } from "@/lib/stores/auth";

/** Базовый URL EventService без завершающего слеша. */
export const EVENT_API_BASE =
  process.env.NEXT_PUBLIC_EVENT_API_URL ??
  "http://localhost:9001/eventservice/api";

/**
 * Выполняет авторизованный HTTP-запрос к EventService.
 *
 * @param path путь относительно EVENT_API_BASE
 * @param init параметры fetch
 * @returns тело ответа
 */
export async function eventRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const userId = getAuthUserId();
  if (!userId) {
    throw new Error("Пользователь не авторизован");
  }

  const response = await fetch(`${EVENT_API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-User-Id": userId,
      ...init?.headers,
    },
  });

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const body = (await response.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch {
      // Тело не JSON — оставляем статус.
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

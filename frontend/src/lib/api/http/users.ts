import { ACTIVITIES } from "@/lib/activities";
import { getAuthUserId } from "@/lib/stores/auth";
import type { ActivityId, UserProfile } from "../types";

/** Базовый URL UserService без завершающего слеша. */
export const USER_API_BASE =
  process.env.NEXT_PUBLIC_USER_API_URL ??
  "http://localhost:9002/userservice/api";

export const USING_MOCK_USERS =
  process.env.NEXT_PUBLIC_USE_MOCK_USERS === "true";

interface BackendInterest {
  id: number;
  name: string;
  image: string;
  description: string;
  tag: string;
}

interface BackendUser {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
  level: number;
  rating: number | null;
  city: string | null;
  about: string | null;
  interests: BackendInterest[];
}

const KNOWN_ACTIVITY_IDS = new Set<ActivityId>(
  ACTIVITIES.map((activity) => activity.id),
);

/** Соответствие activityId фронта и id интереса в UserService (см. Liquibase 004). */
const ACTIVITY_TO_INTEREST_ID: Partial<Record<ActivityId, number>> = {
  football: 1,
  basketball: 2,
  volleyball: 3,
  tennis: 4,
  cycling: 5,
  karaoke: 6,
  boardgames: 7,
  art: 8,
  coffee: 9,
  theatre: 10,
};

const INTEREST_ID_TO_ACTIVITY = Object.fromEntries(
  Object.entries(ACTIVITY_TO_INTEREST_ID).map(([activityId, interestId]) => [
    interestId,
    activityId,
  ]),
) as Record<number, ActivityId>;

/**
 * Преобразует activityId фронта в id интереса UserService.
 *
 * @param interests выбранные активности
 * @returns идентификаторы интересов на бэкенде
 */
export function activityIdsToInterestIds(interests: ActivityId[]): number[] {
  return interests
    .map((activityId) => ACTIVITY_TO_INTEREST_ID[activityId])
    .filter((id): id is number => id != null);
}

/**
 * Выполняет HTTP-запрос к UserService и разбирает JSON-ответ.
 *
 * @param path путь относительно USER_API_BASE
 * @param init параметры fetch
 * @returns тело ответа
 */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${USER_API_BASE}${path}`, {
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
      // Тело не JSON — оставляем статус.
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

/**
 * Извлекает activityId из пути изображения интереса (`/image/football`).
 *
 * @param image путь к изображению
 * @returns activityId или null
 */
function activityIdFromImage(image: string): ActivityId | null {
  const suffix = image.split("/").pop();
  if (!suffix || !KNOWN_ACTIVITY_IDS.has(suffix as ActivityId)) {
    return null;
  }
  return suffix as ActivityId;
}

/**
 * Преобразует DTO UserService в контракт фронтенда.
 *
 * @param user ответ бэкенда
 * @returns профиль пользователя
 */
export function mapUserResponse(user: BackendUser): UserProfile {
  const interests = user.interests
    .map((interest) => activityIdFromImage(interest.image))
    .filter((id): id is ActivityId => id != null);

  return {
    id: String(user.id),
    name: user.name,
    email: user.email,
    avatarUrl: user.avatar,
    level: user.level,
    rating: user.rating,
    city: user.city ?? "",
    bio: user.about ?? "",
    counts: { followers: 0, following: 0, events: 0 },
    interests,
    location: null,
  };
}

/**
 * Загружает пользователя по email (упрощённый вход).
 *
 * @param email логин — email из тестовых данных
 * @returns профиль пользователя
 */
export async function loginByEmail(email: string): Promise<UserProfile> {
  const params = new URLSearchParams({ email: email.trim() });
  const user = await request<BackendUser>(`/users/by-email?${params}`);
  return mapUserResponse(user);
}

export interface CreateUserInput {
  name: string;
  email: string;
  city?: string;
  bio?: string;
  interests: ActivityId[];
}

/**
 * Регистрирует нового пользователя с интересами.
 *
 * @param input данные регистрации
 * @returns созданный профиль
 */
export async function createUser(input: CreateUserInput): Promise<UserProfile> {
  const interestIds = activityIdsToInterestIds(input.interests);
  if (interestIds.length === 0) {
    throw new Error("Выберите хотя бы один интерес");
  }

  const user = await request<BackendUser>("/users", {
    method: "POST",
    body: JSON.stringify({
      name: input.name.trim(),
      email: input.email.trim(),
      city: input.city?.trim() ?? "",
      about: input.bio?.trim() ?? "",
      interestIds,
    }),
  });
  return mapUserResponse(user);
}

/**
 * Загружает текущего пользователя по сохранённому userId.
 *
 * @returns профиль пользователя
 */
async function fetchCurrentUser(): Promise<UserProfile> {
  const userId = getAuthUserId();
  if (!userId) {
    throw new Error("Пользователь не авторизован");
  }
  const user = await request<BackendUser>(`/users/${userId}`);
  return mapUserResponse(user);
}

/**
 * Обновляет профиль текущего пользователя.
 *
 * @param patch частичные изменения
 * @returns обновлённый профиль
 */
async function updateCurrentUser(
  patch: Partial<UserProfile>,
): Promise<UserProfile> {
  const userId = getAuthUserId();
  if (!userId) {
    throw new Error("Пользователь не авторизован");
  }

  const current = await request<BackendUser>(`/users/${userId}`);
  const body = {
    name: patch.name ?? current.name,
    email: current.email,
    avatar: current.avatar,
    level: current.level,
    rating: current.rating,
    city: patch.city ?? current.city ?? "",
    about: patch.bio ?? current.about ?? "",
  };

  const updated = await request<BackendUser>(`/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  return mapUserResponse(updated);
}

/**
 * Заменяет интересы текущего пользователя.
 *
 * @param interests список activityId
 * @returns обновлённый профиль
 */
async function setCurrentUserInterests(
  interests: ActivityId[],
): Promise<UserProfile> {
  const userId = getAuthUserId();
  if (!userId) {
    throw new Error("Пользователь не авторизован");
  }

  const interestIds = activityIdsToInterestIds(interests);
  if (interestIds.length === 0) {
    throw new Error("Нет поддерживаемых интересов для сохранения");
  }

  const updated = await request<BackendUser>(`/users/${userId}/interests`, {
    method: "PUT",
    body: JSON.stringify({ interestIds }),
  });
  return mapUserResponse(updated);
}

/** HTTP-реализация users-части ApiClient. */
export const httpUsersClient = {
  me: fetchCurrentUser,
  updateMe: updateCurrentUser,
  setInterests: setCurrentUserInterests,
};

export { INTEREST_ID_TO_ACTIVITY };

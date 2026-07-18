import type { PlaceSuggestion, ResolvedPlace, SuggestOptions } from "./types";

const SUGGEST_URL = "https://suggest-maps.yandex.ru/v1/suggest";
const GEOCODE_URL = "https://geocode-maps.yandex.ru/v1/";

interface SuggestResultItem {
  title?: { text?: string };
  subtitle?: { text?: string };
  uri?: string;
  address?: { formatted_address?: string };
}

interface SuggestResponse {
  results?: SuggestResultItem[];
}

interface GeocodeFeature {
  GeoObject?: {
    name?: string;
    description?: string;
    metaDataProperty?: {
      GeocoderMetaData?: {
        text?: string;
        Address?: { formatted?: string };
      };
    };
    Point?: { pos?: string };
  };
}

interface GeocodeResponse {
  response?: {
    GeoObjectCollection?: {
      featureMember?: GeocodeFeature[];
    };
  };
}

/**
 * Возвращает API-ключ HTTP Геокодера из окружения (только сервер).
 */
function getYandexGeocoderApiKey(): string {
  const key = process.env.YANDEX_GEOCODER_API_KEY;
  if (!key) {
    throw new Error("Не задан YANDEX_GEOCODER_API_KEY");
  }
  return key;
}

/**
 * Возвращает API-ключ HTTP Геосаджеста из окружения.
 */
function getYandexSuggestApiKey(): string {
  const key = process.env.NEXT_PUBLIC_YANDEX_SUGGEST_API_KEY;
  if (!key) {
    throw new Error("Не задан NEXT_PUBLIC_YANDEX_SUGGEST_API_KEY");
  }
  return key;
}

/**
 * Заголовки для HTTP Геокодера: ключ с ограничением по домену требует Referer.
 */
function getGeocoderRequestHeaders(referer?: string): HeadersInit {
  const resolvedReferer =
    referer?.trim() ||
    process.env.YANDEX_GEOCODER_REFERER?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "http://localhost:3000";

  return { Referer: resolvedReferer };
}

/**
 * Выполняет запрос к HTTP Геокодеру и возвращает разобранный ответ.
 */
async function fetchGeocoder(
  params: URLSearchParams,
  referer?: string,
): Promise<GeocodeResponse> {
  const response = await fetch(`${GEOCODE_URL}?${params.toString()}`, {
    headers: getGeocoderRequestHeaders(referer),
  });

  if (!response.ok) {
    const details = (await response.text()).trim();
    const suffix = details ? `: ${details.slice(0, 200)}` : "";
    throw new Error(`Geocoder API: ${response.status}${suffix}`);
  }

  return (await response.json()) as GeocodeResponse;
}

export async function suggestPlaces(
  text: string,
  options: SuggestOptions,
): Promise<PlaceSuggestion[]> {
  const query = text.trim();
  if (query.length < 2) return [];

  const params = new URLSearchParams({
    apikey: getYandexSuggestApiKey(),
    text: query,
    lang: "ru",
    results: "7",
    sessiontoken: options.sessionToken,
    countries: "ru",
    types: "biz,geo,street,locality",
    print_address: "1",
    attrs: "uri",
  });

  if (options.near) {
    params.set("ll", `${options.near.lng},${options.near.lat}`);
  }

  const response = await fetch(`${SUGGEST_URL}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Suggest API: ${response.status}`);
  }

  const data = (await response.json()) as SuggestResponse;
  return (data.results ?? []).map((item, index) => ({
    id: item.uri ?? `${index}-${item.title?.text ?? "place"}`,
    title: item.title?.text?.trim() ?? "",
    subtitle: item.subtitle?.text?.trim() ?? item.address?.formatted_address ?? null,
    uri: item.uri ?? null,
  })).filter((item) => item.title.length > 0);
}

/**
 * Разрешает подсказку или текстовый адрес в координаты и строку адреса.
 */
export async function resolvePlace(
  input: {
    uri?: string | null;
    geocode?: string;
  },
  options?: { referer?: string },
): Promise<ResolvedPlace | null> {
  const params = new URLSearchParams({
    apikey: getYandexGeocoderApiKey(),
    lang: "ru_RU",
    format: "json",
    results: "1",
  });

  if (input.uri) {
    params.set("uri", input.uri);
  } else if (input.geocode?.trim()) {
    params.set("geocode", input.geocode.trim());
  } else {
    return null;
  }

  const data = await fetchGeocoder(params, options?.referer);
  return parseGeocodeResult(data);
}

/**
 * Обратный геокодинг: координаты → адрес.
 */
export async function reverseGeocode(
  lat: number,
  lng: number,
  options?: { referer?: string },
): Promise<ResolvedPlace | null> {
  const params = new URLSearchParams({
    apikey: getYandexGeocoderApiKey(),
    geocode: `${lng},${lat}`,
    lang: "ru_RU",
    format: "json",
    results: "1",
    kind: "house",
  });

  const data = await fetchGeocoder(params, options?.referer);
  const resolved = parseGeocodeResult(data);
  if (resolved) return resolved;

  return {
    lat: Number(lat.toFixed(6)),
    lng: Number(lng.toFixed(6)),
    address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
  };
}

/**
 * Парсит первый объект из ответа Geocoder API.
 */
function parseGeocodeResult(data: GeocodeResponse): ResolvedPlace | null {
  const geoObject = data.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject;
  if (!geoObject?.Point?.pos) return null;

  const [lngRaw, latRaw] = geoObject.Point.pos.split(" ");
  const lat = Number(Number(latRaw).toFixed(6));
  const lng = Number(Number(lngRaw).toFixed(6));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const meta = geoObject.metaDataProperty?.GeocoderMetaData;
  const address =
    meta?.Address?.formatted?.trim() ||
    meta?.text?.trim() ||
    geoObject.description?.trim() ||
    geoObject.name?.trim() ||
    `${lat}, ${lng}`;

  return { lat, lng, address };
}

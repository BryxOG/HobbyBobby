export const YANDEX_MAPS_SCRIPT_ID = "yandex-maps-api";

/**
 * Возвращает URL загрузчика Yandex Maps JS API v3.
 */
export function getYandexMapsScriptUrl(apiKey: string): string {
  return `https://api-maps.yandex.ru/v3/?apikey=${encodeURIComponent(apiKey)}&lang=ru_RU`;
}

"use client";

import { getYandexMapsScriptUrl, YANDEX_MAPS_SCRIPT_ID } from "./yandexMapsConfig";

declare global {
  interface Window {
    ymaps3?: YMaps3Api;
  }
}

type Coordinates = [number, number];

interface YMapLocation {
  center: Coordinates;
  zoom?: number;
  duration?: number;
}

export interface YMapLike {
  addChild(child: unknown): void;
  removeChild?(child: unknown): void;
  setLocation?(location: YMapLocation): void;
  update?(patch: { location: YMapLocation }): void;
  destroy?(): void;
}

export interface YMaps3Api {
  ready: Promise<void>;
  YMap: new (
    element: HTMLElement,
    options: { location: YMapLocation; behaviors?: string[] },
  ) => YMapLike;
  YMapDefaultSchemeLayer: new (options: object) => unknown;
  YMapDefaultFeaturesLayer: new (options: object) => unknown;
  YMapMarker: new (options: { coordinates: Coordinates }, element: HTMLElement) => unknown;
  YMapListener: new (options: {
    layer: "any";
    onClick: (_object: unknown, event: { coordinates?: Coordinates }) => void;
  }) => unknown;
}

const LOAD_TIMEOUT_MS = 20_000;
let loader: Promise<YMaps3Api> | null = null;

/**
 * Сбрасывает кэш загрузчика — для кнопки «Повторить».
 */
export function resetYandexMapsLoader(): void {
  loader = null;
  document.getElementById(YANDEX_MAPS_SCRIPT_ID)?.remove();
  delete window.ymaps3;
}

/**
 * Загружает Yandex Maps JS API v3 один раз на страницу.
 */
export function loadYandexMapsApi(): Promise<YMaps3Api> {
  const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY;
  if (!apiKey) {
    return Promise.reject(
      new Error("Не задан NEXT_PUBLIC_YANDEX_MAPS_API_KEY для Яндекс Карт"),
    );
  }
  if (!loader) {
    loader = loadYandexMapsApiInternal(apiKey);
  }
  return loader;
}

async function loadYandexMapsApiInternal(apiKey: string): Promise<YMaps3Api> {
  const scriptUrl = getYandexMapsScriptUrl(apiKey);
  const ready = await waitForYmaps3(scriptUrl, apiKey);
  await ready.ready;
  return ready;
}

function waitForYmaps3(scriptUrl: string, apiKey: string): Promise<YMaps3Api> {
  if (window.ymaps3) {
    return Promise.resolve(window.ymaps3);
  }

  return new Promise((resolve, reject) => {
    const started = Date.now();

    const finish = (api: YMaps3Api) => {
      window.clearInterval(interval);
      resolve(api);
    };

    const fail = (error: Error) => {
      window.clearInterval(interval);
      loader = null;
      reject(error);
    };

    const tick = () => {
      if (window.ymaps3) {
        finish(window.ymaps3);
        return;
      }
      if (Date.now() - started > LOAD_TIMEOUT_MS) {
        void diagnoseLoadError(scriptUrl).then((message) =>
          fail(new Error(message)),
        );
      }
    };

    ensureYandexMapsScript(scriptUrl, apiKey, fail);
    const interval = window.setInterval(tick, 50);
    tick();
  });
}

function ensureYandexMapsScript(
  scriptUrl: string,
  apiKey: string,
  onFail: (error: Error) => void,
): void {
  const existing = document.getElementById(
    YANDEX_MAPS_SCRIPT_ID,
  ) as HTMLScriptElement | null;

  if (existing) {
    if (existing.src.includes(apiKey)) {
      existing.addEventListener(
        "error",
        () => {
          void diagnoseLoadError(scriptUrl).then((message) =>
            onFail(new Error(message)),
          );
        },
        { once: true },
      );
      return;
    }
    existing.remove();
  }

  const script = document.createElement("script");
  script.id = YANDEX_MAPS_SCRIPT_ID;
  script.src = scriptUrl;
  script.async = true;
  script.onerror = () => {
    void diagnoseLoadError(scriptUrl).then((message) =>
      onFail(new Error(message)),
    );
  };
  document.head.appendChild(script);
}

async function diagnoseLoadError(scriptUrl: string): Promise<string> {
  try {
    const response = await fetch(scriptUrl);
    if (!response.ok) {
      const body = (await response.text()).trim();
      if (body.includes("Invalid key")) {
        return "Неверный API-ключ Яндекс Карт. Проверьте NEXT_PUBLIC_YANDEX_MAPS_API_KEY.";
      }
      return `Yandex Maps API: ${response.status}${body ? ` — ${body.slice(0, 160)}` : ""}`;
    }
  } catch {
    // Сеть или блокировщик рекламы — подсказка ниже.
  }

  return "Не удалось загрузить Yandex Maps API. Проверьте интернет, отключите блокировщик рекламы и добавьте localhost в ограничения HTTP Referer ключа в кабинете Яндекса.";
}

/**
 * Пытается обновить центр карты разными API-методами v3.
 */
export function setMapLocation(map: unknown, location: YMapLocation): void {
  const request: YMapLocation = {
    center: location.center,
    zoom: location.zoom ?? 14,
    duration: location.duration ?? 700,
  };

  const target = map as YMapLike;

  if (typeof target.setLocation === "function") {
    target.setLocation.call(map, request);
    return;
  }
  if (typeof target.update === "function") {
    target.update.call(map, { location: request });
  }
}

/**
 * Возвращает центр карты по геопозиции браузера, если доступен.
 */
export function detectBrowserCenter(timeoutMs = 3000): Promise<Coordinates | null> {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve([position.coords.longitude, position.coords.latitude]),
      () => resolve(null),
      {
        enableHighAccuracy: false,
        timeout: timeoutMs,
        maximumAge: 60_000,
      },
    );
  });
}

"use client";

declare global {
  interface Window {
    ymaps3?: YMaps3Api;
  }
}

type Coordinates = [number, number];

interface YMapLocation {
  center: Coordinates;
  zoom: number;
  duration?: number;
}

interface YMapLike {
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

let loader: Promise<YMaps3Api> | null = null;

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
  if (loader) {
    return loader;
  }

  loader = new Promise((resolve, reject) => {
    if (window.ymaps3) {
      resolve(window.ymaps3);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://api-maps.yandex.ru/v3/?apikey=${encodeURIComponent(apiKey)}&lang=ru_RU`;
    script.async = true;
    script.onload = () => {
      if (!window.ymaps3) {
        loader = null;
        reject(new Error("Yandex Maps API загрузился, но ymaps3 недоступен"));
        return;
      }
      resolve(window.ymaps3);
    };
    script.onerror = () => {
      loader = null;
      reject(new Error("Не удалось загрузить Yandex Maps API"));
    };
    document.head.appendChild(script);
  });

  return loader;
}

/**
 * Пытается обновить центр карты разными API-методами v3.
 */
export function setMapLocation(map: YMapLike, location: YMapLocation): void {
  if (typeof map.setLocation === "function") {
    map.setLocation(location);
    return;
  }
  if (typeof map.update === "function") {
    map.update({ location });
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

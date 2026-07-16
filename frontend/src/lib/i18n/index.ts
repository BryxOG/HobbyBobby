import { ru, type Dictionary } from "./ru";

export type Locale = "ru";

export const locales: Record<Locale, Dictionary> = { ru };

export const defaultLocale: Locale = "ru";

/**
 * Screens call `t.events.join` — a plain object walk, so TypeScript catches a
 * typo'd key at build time and there is no runtime lookup cost.
 */
export function getDictionary(locale: Locale = defaultLocale): Dictionary {
  return locales[locale];
}

export type { Dictionary };
export { ru };

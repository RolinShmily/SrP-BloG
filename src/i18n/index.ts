import { en } from "./en";
import { DEFAULT_LOCALE, LOCALES, isLocale } from "./types";
import type { Locale } from "./types";
import { zh } from "./zh";
import type { Dictionary } from "./zh";

export { DEFAULT_LOCALE, LOCALES, isLocale, LOCALE_NAMES, toHtmlLang } from "./types";
export type { Locale } from "./types";
export type { Dictionary } from "./zh";

/** All dictionaries keyed by locale. */
export const dictionaries: Record<Locale, Dictionary> = { zh, en };

/** Returns the dictionary for `locale` (defaults to zh). */
export function getDictionary(locale: Locale = DEFAULT_LOCALE): Dictionary {
  return dictionaries[locale];
}

/**
 * Collects every dotted key path of a nested dictionary object.
 * Used by tooling (`scripts/verify-content.ts`) to assert zh/en key parity.
 */
export function collectDictionaryKeys(value: unknown, prefix = ""): string[] {
  if (value === null || typeof value !== "object") {
    return prefix ? [prefix] : [];
  }
  const keys: string[] = [];
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    keys.push(...collectDictionaryKeys(child, prefix ? `${prefix}.${key}` : key));
  }
  return keys;
}

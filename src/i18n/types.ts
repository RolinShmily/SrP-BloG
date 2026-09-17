/**
 * Locale primitives shared by the UI i18n layer and the content data layer.
 *
 * This module is intentionally dependency-free (no React, no Node APIs) so it can
 * be imported from both client components and build-time scripts.
 */

export type Locale = "zh" | "en";

/** Locale used when none is specified and as the fallback content locale. */
export const DEFAULT_LOCALE: Locale = "zh";

/** All supported locales, in display order. */
export const LOCALES: readonly Locale[] = ["zh", "en"];

/** Human readable names for each locale (rendered in its own language). */
export const LOCALE_NAMES: Record<Locale, string> = {
  zh: "简体中文",
  en: "English",
};

/** Type guard for narrowing arbitrary values (URL params, localStorage) to a Locale. */
export function isLocale(value: unknown): value is Locale {
  return value === "zh" || value === "en";
}

/** BCP-47 tag used for `document.documentElement.lang`. */
export function toHtmlLang(locale: Locale): string {
  return locale === "zh" ? "zh-CN" : "en";
}

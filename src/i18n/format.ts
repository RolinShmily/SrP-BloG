import { getDictionary } from "./index";
import type { Locale } from "./types";

/**
 * Locale-aware number/reading-time formatting shared by server and client
 * components. Kept free of React so it can be used from `<T>` call sites
 * (server) as well as `useLocale()` call sites (client).
 */

/** Extracts the integer minute count from a `"X 分钟阅读"` style string. */
export function readingMinutes(readingTime: string, wordCount = 0): number {
  const match = /(\d+)/.exec(readingTime ?? "");
  if (match) return Math.max(1, Number.parseInt(match[1], 10));
  return Math.max(1, Math.ceil(wordCount / 350));
}

/** `1,234 字` / `1,234 words`. */
export function formatWordCount(wordCount: number, locale: Locale): string {
  const value = wordCount.toLocaleString(locale === "zh" ? "zh-CN" : "en-US");
  return `${value} ${getDictionary(locale).stats.words}`;
}

/**
 * Builds a reading-time label in `locale` from the canonical `readingTime`
 * string. Phase A always emits `"X 分钟阅读"`, so the minute count is extracted
 * and re-labelled with the target locale's `stats.minutesRead` unit.
 */
export function formatReadingTime(readingTime: string, wordCount: number, locale: Locale): string {
  return `${readingMinutes(readingTime, wordCount)} ${getDictionary(locale).stats.minutesRead}`;
}

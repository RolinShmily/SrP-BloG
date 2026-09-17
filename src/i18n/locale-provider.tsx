"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_LOCALE, getDictionary, isLocale, toHtmlLang } from "./index";
import type { Dictionary, Locale } from "./index";

/** localStorage key holding the persisted locale preference. */
export const LOCALE_STORAGE_KEY = "srp-locale";

export interface LocaleContextValue {
  locale: Locale;
  /** Persists the choice to localStorage (and mirrors it into `?lang=`). */
  setLocale: (locale: Locale) => void;
  /** Switches to the other supported locale. */
  toggleLocale: () => void;
  /** Dictionary for the active locale (`t.nav.home`, `t.search.placeholder`, …). */
  t: Dictionary;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

/**
 * Resolves the initial locale. Priority:
 * 1. `?lang=` URL param (shareable links, works for the static export)
 * 2. `localStorage["srp-locale"]`
 * 3. DEFAULT_LOCALE
 */
function readInitialLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  try {
    const fromUrl = new URLSearchParams(window.location.search).get("lang");
    if (isLocale(fromUrl)) return fromUrl;

    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isLocale(stored)) return stored;
  } catch {
    /* URL/localStorage unavailable (privacy mode, sandboxed iframe) — use default. */
  }
  return DEFAULT_LOCALE;
}

function persistLocale(locale: Locale): void {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    /* Storage can be disabled; the in-memory state still works. */
  }
}

function mirrorLocaleInUrl(locale: Locale): void {
  if (typeof window === "undefined") return;
  try {
    const url = new URL(window.location.href);
    if (locale === DEFAULT_LOCALE) {
      url.searchParams.delete("lang");
    } else {
      url.searchParams.set("lang", locale);
    }
    window.history.replaceState(null, "", url.toString());
  } catch {
    /* replaceState may be blocked in exotic environments; ignore. */
  }
}

export interface LocaleProviderProps {
  children: ReactNode;
  /** Optional override for SSR/tests; defaults to DEFAULT_LOCALE on the server. */
  initialLocale?: Locale;
}

/**
 * Client-side locale provider compatible with `output: "export"`.
 *
 * All state lives in the browser (no cookies/middleware), so every page is
 * statically renderable while language switching still works without navigation.
 */
export function LocaleProvider({ children, initialLocale }: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale ?? DEFAULT_LOCALE);

  // Resolve the persisted/URL locale after hydration so server and client markup match.
  useEffect(() => {
    const resolved = readInitialLocale();
    setLocaleState(resolved);
  }, []);

  // Keep <html lang> and the CSS locale marker in sync with the active locale.
  useEffect(() => {
    document.documentElement.lang = toHtmlLang(locale);
    document.documentElement.dataset.locale = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    persistLocale(next);
    mirrorLocaleInUrl(next);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocaleState((current) => {
      const next: Locale = current === "zh" ? "en" : "zh";
      persistLocale(next);
      mirrorLocaleInUrl(next);
      return next;
    });
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, setLocale, toggleLocale, t: getDictionary(locale) }),
    [locale, setLocale, toggleLocale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

/** Access the active locale, setter, and dictionary. */
export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale() must be used inside a <LocaleProvider>.");
  }
  return context;
}

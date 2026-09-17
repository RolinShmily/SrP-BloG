"use client";

import { useLocale } from "@/i18n/locale-provider";
import { navIconButtonClass } from "@/components/layout/nav-button";

/**
 * Compact `中 / EN` language switch, styled as one of the header's bordered
 * controls.
 *
 * Renders the zh default on the server and reconciles to the persisted locale
 * after hydration (same pattern as `ThemeToggle`), so markup stays stable.
 */
export function LocaleToggle({ className }: { className?: string }) {
  const { locale, toggleLocale, t } = useLocale();

  return (
    <button
      type="button"
      onClick={toggleLocale}
      aria-label={t.common.switchLanguage}
      title={t.common.switchLanguage}
      className={`${navIconButtonClass} w-auto gap-0.5 px-2 font-mono text-xs ${className ?? ""}`}
    >
      <span
        className={locale === "zh" ? "font-semibold text-foreground" : "opacity-60"}
        data-locale-option="zh"
      >
        中
      </span>
      <span className="opacity-40">/</span>
      <span
        className={locale === "en" ? "font-semibold text-foreground" : "opacity-60"}
        data-locale-option="en"
      >
        EN
      </span>
    </button>
  );
}

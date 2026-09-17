"use client";

import { useLocale } from "@/i18n/locale-provider";
import { UPVCounter } from "./upv-counter";

/**
 * `<UPVCounter>` with localized copy. Keeps the counter primitive itself
 * language-free while wiring `次浏览 / 位访客` (and the number format) here.
 */
export function LocalizedUPVCounter({ path, className }: { path: string; className?: string }) {
  const { t, locale } = useLocale();
  const formatter = new Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en-US");
  const template = `{views} ${t.stats.views} · {visitors} ${t.stats.visitors}`;

  return (
    <UPVCounter
      path={path}
      className={className}
      template={template}
      formatNumber={(value) => formatter.format(value)}
    />
  );
}

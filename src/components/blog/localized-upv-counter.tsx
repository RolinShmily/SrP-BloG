"use client";

import { useLocale } from "@/i18n/locale-provider";
import { siteConfig } from "@/config/site";
import { UPVCounter } from "./upv-counter";

export interface LocalizedUPVCounterProps {
  path: string;
  className?: string;
  readOnly?: boolean;
  prefixDot?: boolean;
  showSkeleton?: boolean;
  context?: "post" | "card";
}

/**
 * `<UPVCounter>` with localized copy. Keeps the counter primitive itself
 * language-free while wiring `次浏览 / views` (and the number format) here.
 * Only displays page views (浏览量) — visitors are reserved for /archives.
 */
export function LocalizedUPVCounter({
  path,
  className,
  readOnly,
  prefixDot,
  showSkeleton,
  context = "post",
}: LocalizedUPVCounterProps) {
  const { t, locale } = useLocale();

  const isEnabled =
    siteConfig.upv?.enabled !== false &&
    (context === "card"
      ? siteConfig.upv?.showCardCounter !== false
      : siteConfig.upv?.showPostCounter !== false);

  if (!isEnabled) {
    return null;
  }

  const formatter = new Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en-US");
  // Only displays views ({views} 次浏览 / {views} views)
  const template = `{views} ${t.stats.views}`;

  return (
    <UPVCounter
      path={path}
      className={className}
      template={template}
      formatNumber={(value) => formatter.format(value)}
      readOnly={readOnly}
      prefixDot={prefixDot}
      showSkeleton={showSkeleton}
      context={context}
    />
  );
}

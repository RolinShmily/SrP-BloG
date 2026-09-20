"use client";

import { useLocale } from "@/i18n/locale-provider";
import { cn } from "@/lib/utils";

interface HumanAuthoredBadgeProps {
  className?: string;
}

/**
 * "Human Authored · Not by AI" (真人撰写 · 非AI生成) provenance badge.
 *
 * Renders an authenticity emblem with a friendly human-crafted motif,
 * bilingual copy, and a subtle accent highlight on hover.
 */
export function HumanAuthoredBadge({ className }: HumanAuthoredBadgeProps) {
  const { t } = useLocale();

  return (
    <div
      className={cn(
        "group inline-flex shrink-0 items-center gap-2.5 rounded-lg border border-border/70 bg-muted/30 px-3 py-1.5 shadow-xs select-none font-mono transition-all duration-200 hover:border-[#f75c7e]/40 hover:bg-[#f75c7e]/5",
        className
      )}
      title={`${t.post.humanAuthored} · ${t.post.notAiGenerated}`}
      aria-label={`${t.post.humanAuthored}, ${t.post.notAiGenerated}`}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5 shrink-0 text-muted-foreground transition-colors duration-200 group-hover:text-[#f75c7e]"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" strokeWidth={2} />
        <circle cx="8.5" cy="10" r="1.25" fill="currentColor" stroke="none" />
        <circle cx="15.5" cy="10" r="1.25" fill="currentColor" stroke="none" />
        <path d="M8 14.2c1.2 1.6 2.6 2.2 4 2.2s2.8-.6 4-2.2" strokeWidth={2} />
      </svg>
      <div className="flex flex-col leading-tight">
        <span className="text-[10px] text-muted-foreground tracking-wider transition-colors duration-200">
          {t.post.humanAuthored}
        </span>
        <span className="text-xs font-semibold text-foreground tracking-wide transition-colors duration-200">
          {t.post.notAiGenerated}
        </span>
      </div>
    </div>
  );
}

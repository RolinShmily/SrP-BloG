"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TocItem } from "@/lib/content/types";
import { useLocale } from "@/i18n/locale-provider";
import { cn } from "@/lib/utils";

interface TocProps {
  toc: TocItem[];
}

/** Per-section reading state derived from the scroll position. */
interface HeadingProgress {
  inView: boolean;
  progress: number;
}

const ARROW_OFFSET = 70;

/**
 * Shared scroll-to helper. Keeps the heading clear of the floating navbar and
 * mirrors the target into the address bar so the anchor stays shareable.
 */
function scrollToHeading(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - ARROW_OFFSET;
  window.scrollTo({ top, behavior: "smooth" });
  window.history.pushState(null, "", `#${id}`);
}

export function MobileToc({ toc }: TocProps) {
  const [mobileExpanded, setMobileExpanded] = useState<boolean>(false);
  const { t } = useLocale();

  if (!toc || toc.length === 0) return null;

  const minLevel = Math.min(...toc.map((item) => item.level));

  return (
    <div className="xl:hidden my-6 rounded-xl border border-border/60 bg-card/40 overflow-hidden transition-all">
      <button
        type="button"
        onClick={() => setMobileExpanded(!mobileExpanded)}
        className="w-full flex items-center justify-between p-3.5 text-xs font-medium text-foreground hover:bg-muted/50 transition-colors"
        aria-expanded={mobileExpanded}
      >
        <span className="uppercase tracking-[0.12em] text-xs text-muted-foreground">
          {t.post.tableOfContents}
        </span>
        <span className="flex items-center gap-2 text-muted-foreground">
          <span className="font-mono text-xs">{toc.length}</span>
          {/* Chevron flips via rotation so both states share one glyph. */}
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className={cn(
              "transition-transform duration-200",
              mobileExpanded && "rotate-180"
            )}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>

      {mobileExpanded && (
        <nav className="px-3.5 pb-3.5 pt-1 border-t border-border/60 space-y-0.5 max-h-60 overflow-y-auto">
          {toc.map((item) => {
            const indent = (item.level - minLevel) * 10;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  scrollToHeading(item.id);
                  setMobileExpanded(false);
                }}
                style={{ paddingLeft: `${indent}px` }}
                className="block text-sm py-1 text-muted-foreground hover:text-foreground transition-colors truncate"
              >
                {item.text}
              </a>
            );
          })}
        </nav>
      )}
    </div>
  );
}

/**
 * Sticky desktop table of contents with a per-section reading meter.
 *
 * The active section is not just a colour swap: every entry carries a rail on
 * its leading edge whose fill (`progress`) tracks how far the reader has moved
 * through that section, and the rail stays lit once the section is behind them.
 * Consecutive in-view entries merge into one rounded highlight block, which is
 * why the corner rounding is computed from the neighbours rather than fixed.
 */
export function DesktopToc({ toc }: TocProps) {
  const [progress, setProgress] = useState<Record<string, HeadingProgress>>({});
  const frame = useRef<number>(0);
  const { t } = useLocale();

  const measure = useCallback(() => {
    if (toc.length === 0) return;

    const article = document.getElementById("article-content");
    const headings = toc
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);

    if (headings.length === 0) return;

    const windowHeight = window.innerHeight;
    const pageOffset = window.scrollY - (article?.offsetTop ?? 0);
    // Fall back to the article's own extent when a heading has no successor.
    const endOffset = (article?.offsetHeight ?? 0) + 127;

    const next: Record<string, HeadingProgress> = {};

    headings.forEach((el, index) => {
      const nextTop = headings[index + 1]?.offsetTop ?? endOffset;
      const rangeStart = el.offsetTop - pageOffset;
      const rangeEnd = nextTop - pageOffset - el.offsetHeight;
      const span = rangeEnd - rangeStart;
      const raw = span === 0 ? 1 : (windowHeight - rangeStart) / span;

      next[el.id] = {
        inView: rangeStart < windowHeight && rangeEnd > 0,
        progress: Math.max(0, Math.min(1, raw)),
      };
    });

    setProgress(next);
  }, [toc]);

  useEffect(() => {
    measure();

    // Scroll fires far more often than the layout can meaningfully change, so
    // the measurement is collapsed into one frame.
    const onScroll = () => {
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(measure);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      cancelAnimationFrame(frame.current);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [measure]);

  if (!toc || toc.length === 0) return null;

  const minLevel = Math.min(...toc.map((item) => item.level));
  const isRead = (id: string) => {
    const state = progress[id];
    return state ? !state.inView && state.progress === 1 : false;
  };

  return (
    // The sticky positioning lives on the <aside> itself: an inner sticky child
    // could only travel within the aside's own (short) height and would scroll
    // away with the header.
    <aside className="sticky top-20 hidden max-h-[calc(100vh-6rem)] w-60 shrink-0 overflow-y-auto xl:block">
      <p className="mb-4 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {t.post.tableOfContents}
      </p>

      <nav>
        <ul className="space-y-0.5">
            {toc.map((item, index) => {
              const state = progress[item.id];
              const inView = state?.inView ?? false;
              // Merge adjacent active entries into a single highlight block.
              const joinsPrevious = index > 0 && (progress[toc[index - 1].id]?.inView ?? false);
              const joinsNext =
                index < toc.length - 1 && (progress[toc[index + 1].id]?.inView ?? false);
              const read = isRead(item.id);

              return (
                <li key={item.id}>
                  <div className="relative">
                    <span
                      aria-hidden
                      className={cn(
                        "toc-rail",
                        inView ? "bg-[#f75c7e]" : read ? "bg-border" : "bg-transparent"
                      )}
                      style={{ height: `${(state?.progress ?? 0) * 90}%` }}
                    />
                    <a
                      href={`#${item.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        scrollToHeading(item.id);
                      }}
                      style={{ paddingLeft: `${12 + (item.level - minLevel) * 12}px` }}
                      className={cn(
                        "ms-2 block py-1 pr-3 text-sm leading-relaxed line-clamp-2 transition-all duration-200",
                        inView
                          ? "bg-muted font-medium text-[#f75c7e]"
                          : "text-muted-foreground hover:text-foreground",
                        inView && !joinsPrevious && "rounded-t-md",
                        inView && !joinsNext && "rounded-b-md"
                      )}
                    >
                      {item.text}
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
        </nav>
    </aside>
  );
}

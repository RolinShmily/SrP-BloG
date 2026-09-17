"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import type { Post, TagInfo } from "@/lib/content/types";
import { PostCard } from "./post-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/i18n/locale-provider";
import { Tag, X, MousePointerClick, Newspaper } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagsViewProps {
  posts: Post[];
  tags: TagInfo[];
}

/**
 * Interactive tag-cloud browser.
 *
 * Sizing:
 * - Dynamic font-size scaling proportionally based on article frequency.
 * - All unselected tags maintain a clean, neutral theme (no preset colored borders).
 *
 * Selection:
 * - Selected tags receive a distinctive red/pink outline circle ("红圈").
 * - Supports multi-selection by default: clicking toggles tags into/out of the filter.
 * - Stable viewport: Selecting or clearing tags will NEVER forcibly scroll the page down.
 * - Filter mode: Supports both OR (any selected tag) and AND (all selected tags).
 */
export function TagsView({ posts, tags }: TagsViewProps) {
  const { t } = useLocale();
  const searchParams = useSearchParams();

  // Parse initial tags from URL search params (supporting comma-separated and multiple keys)
  const initialTags = useMemo(() => {
    const rawList = searchParams.getAll("tag");
    const parsed: string[] = [];
    for (const raw of rawList) {
      for (const item of raw.split(",")) {
        const trimmed = item.trim();
        if (trimmed && !parsed.includes(trimmed)) {
          parsed.push(trimmed);
        }
      }
    }
    return parsed;
  }, [searchParams]);

  const [selectedTags, setSelectedTags] = useState<string[]>(initialTags);
  const [matchMode, setMatchMode] = useState<"or" | "and">("or");

  useEffect(() => {
    setSelectedTags(initialTags);
  }, [initialTags]);

  // Compute tag frequencies for dynamic cloud sizing
  const counts = useMemo(() => tags.map((t) => t.count), [tags]);
  const maxCount = useMemo(() => (counts.length ? Math.max(...counts) : 1), [counts]);
  const minCount = useMemo(() => (counts.length ? Math.min(...counts) : 1), [counts]);

  // Font-size scaling: 0.85rem (13.6px) up to 1.3rem (20.8px) based on post count
  const scaleFor = (count: number) => {
    if (maxCount === minCount) return 0.95;
    const tRatio = (count - minCount) / (maxCount - minCount);
    return Number((0.85 + tRatio * 0.45).toFixed(3));
  };

  const handleToggleTag = (tagName: string) => {
    setSelectedTags((prev) => {
      const isPresent = prev.includes(tagName);
      const next = isPresent
        ? prev.filter((t) => t !== tagName)
        : [...prev, tagName];

      // Synchronize URL search params
      if (next.length === 0) {
        window.history.replaceState(null, "", "/tags/");
      } else {
        window.history.replaceState(
          null,
          "",
          `/tags/?tag=${encodeURIComponent(next.join(","))}`
        );
      }
      return next;
    });
    // NOTE: Keep scroll position completely stable (no scrollTo down).
  };

  const clearFilter = () => {
    setSelectedTags([]);
    window.history.replaceState(null, "", "/tags/");
  };

  const filteredPosts = useMemo(() => {
    if (selectedTags.length === 0) return [];
    if (matchMode === "and") {
      return posts.filter((p) => selectedTags.every((t) => p.tags.includes(t)));
    }
    return posts.filter((p) => selectedTags.some((t) => p.tags.includes(t)));
  }, [posts, selectedTags, matchMode]);

  return (
    <div className="space-y-10">
      {/* Header */}
      <div
        className="section-animate-in space-y-1.5 pb-2"
        style={{ "--section-index": 0 } as React.CSSProperties}
      >
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
          {t.pages.tags.title}
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t.tags.topicsCount.replace("{count}", String(tags.length))}
        </p>
      </div>

      {/* Tags Cloud */}
      <section
        className="section-animate-in space-y-3"
        style={{ "--section-index": 1 } as React.CSSProperties}
      >
        <div className="flex items-center justify-between text-xs text-muted-foreground uppercase tracking-wider">
          <div className="flex items-center gap-2 font-semibold">
            <Tag className="h-3.5 w-3.5 text-[#f75c7e]" />
            <span>
              {t.tags.all} ({tags.length})
            </span>
            {selectedTags.length > 0 && (
              <span className="text-[#f75c7e] normal-case font-medium">
                · 已选 {selectedTags.length}
              </span>
            )}
          </div>
          {selectedTags.length > 0 && (
            <button
              type="button"
              onClick={clearFilter}
              className="text-xs text-[#f75c7e] hover:underline cursor-pointer"
            >
              {t.tags.clearFilter}
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 p-5 sm:p-6 rounded-2xl border border-border/80 bg-card/50">
          {tags.length === 0 ? (
            <span className="text-sm text-muted-foreground">{t.tags.empty}</span>
          ) : (
            tags.map((tag) => {
              const isSelected = selectedTags.includes(tag.name);
              const scale = scaleFor(tag.count);

              return (
                <button
                  key={tag.name}
                  type="button"
                  onClick={() => handleToggleTag(tag.name)}
                  style={{ fontSize: `${scale}rem` }}
                  className={cn(
                    "apple-float-chip inline-flex items-center rounded-2xl px-[0.85em] py-[0.4em] font-medium transition-all duration-200 cursor-pointer select-none",
                    isSelected
                      ? "border-2 border-[#f75c7e] bg-[#f75c7e]/12 text-[#f75c7e] dark:text-[#f75c7e] shadow-[0_0_0_1px_rgba(247,92,126,0.35)] scale-105 font-semibold"
                      : "border border-border/80 bg-background/80 text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted/40"
                  )}
                >
                  <span className="apple-float-label">
                    <span>#{tag.name}</span>
                    <span
                      className={cn(
                        "ml-1.5 px-1.5 py-0.2 rounded-full font-mono text-[0.72em] font-semibold transition-colors",
                        isSelected
                          ? "bg-[#f75c7e] text-white shadow-xs"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {tag.count}
                    </span>
                  </span>
                </button>
              );
            })
          )}
        </div>
      </section>

      {/* Results Section: Only displayed when at least one tag is selected */}
      <section className="space-y-6 pt-2">
        {selectedTags.length > 0 ? (
          <>
            {/* Filter Status Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Newspaper className="h-4 w-4 text-[#f75c7e]" />
                <span className="text-muted-foreground">{t.tags.filterLabel}:</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {selectedTags.map((tagName) => (
                    <Badge
                      key={tagName}
                      variant="outline"
                      onClick={() => handleToggleTag(tagName)}
                      className="border-[#f75c7e] text-[#f75c7e] bg-[#f75c7e]/10 text-xs font-medium gap-1 pr-1.5 cursor-pointer hover:bg-[#f75c7e]/20 transition-colors"
                    >
                      <span>#{tagName}</span>
                      <X className="h-3 w-3 opacity-70 hover:opacity-100" />
                    </Badge>
                  ))}
                </div>
                <span className="text-meta text-muted-foreground ml-1">
                  ({filteredPosts.length} {t.stats.posts})
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                {selectedTags.length > 1 && (
                  <div className="inline-flex items-center rounded-lg border border-border p-0.5 text-xs bg-muted/40">
                    <button
                      type="button"
                      onClick={() => setMatchMode("or")}
                      className={cn(
                        "px-2 py-0.5 rounded-md transition-colors cursor-pointer",
                        matchMode === "or"
                          ? "bg-background text-foreground shadow-xs font-medium"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {t.tags.matchOr}
                    </button>
                    <button
                      type="button"
                      onClick={() => setMatchMode("and")}
                      className={cn(
                        "px-2 py-0.5 rounded-md transition-colors cursor-pointer",
                        matchMode === "and"
                          ? "bg-background text-foreground shadow-xs font-medium"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {t.tags.matchAnd}
                    </button>
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilter}
                  className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>{t.tags.clearFilter}</span>
                </Button>
              </div>
            </div>

            {/* Filtered Posts List */}
            {filteredPosts.length === 0 ? (
              <div className="p-12 text-center rounded-xl border border-border bg-card text-muted-foreground space-y-3">
                <p className="text-sm">{t.tags.emptyFiltered}</p>
                <Button variant="outline" size="sm" onClick={clearFilter} className="text-xs">
                  {t.tags.clearFilter}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPosts.map((post, idx) => (
                  <div
                    key={post.slug}
                    className="card-animate-in"
                    style={{ "--stagger-index": idx } as React.CSSProperties}
                  >
                    <PostCard post={post} priorityImage={idx === 0} />
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          /* Default state when no tag is selected: elegant prompt */
          <div className="rounded-2xl border border-dashed border-border/80 p-8 sm:p-12 text-center space-y-3 bg-muted/20">
            <div className="mx-auto w-11 h-11 rounded-full bg-muted/70 flex items-center justify-center text-muted-foreground">
              <MousePointerClick className="h-5 w-5 text-[#f75c7e]" />
            </div>
            <p className="text-sm font-medium text-foreground">
              {t.tags.selectPrompt}
            </p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
              {t.tags.subheading}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

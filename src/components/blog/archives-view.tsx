"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import type { Post, SiteStats } from "@/lib/content/types";
import { sortPostsByPublishedDate } from "@/lib/content/sort";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SiteUpvCards } from "./site-upv-cards";
import { useLocale } from "@/i18n/locale-provider";
import { formatWordCount } from "@/i18n/format";
import { Search, FileText, BookOpen } from "lucide-react";
import { openSearch } from "./search-dialog";

interface ArchivesViewProps {
  stats: SiteStats;
  posts: Post[];
}

export function ArchivesView({ stats, posts }: ArchivesViewProps) {
  const { t, locale } = useLocale();

  useEffect(() => {
    const handleHashTrigger = () => {
      if (
        window.location.hash === "#search" ||
        window.location.hash === "#archive-search-input"
      ) {
        openSearch();
      }
    };

    handleHashTrigger();
    window.addEventListener("hashchange", handleHashTrigger);
    return () => window.removeEventListener("hashchange", handleHashTrigger);
  }, []);

  // Archive timelines stay chronological
  const chronologicalPosts = useMemo(() => sortPostsByPublishedDate(posts), [posts]);

  const postsByYear = useMemo(() => {
    const map = new Map<string, Post[]>();
    for (const post of chronologicalPosts) {
      const year = post.published.split("-")[0] || "—";
      const list = map.get(year) || [];
      list.push(post);
      map.set(year, list);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [chronologicalPosts]);

  return (
    <div className="space-y-10">
      {/* Header */}
      <div
        className="section-animate-in space-y-1 pb-2"
        style={{ "--section-index": 0 } as React.CSSProperties}
      >
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
          {t.archives.heading}
        </h1>
        <p className="text-sm text-muted-foreground">{t.archives.subheading}</p>
      </div>

      {/* Stats Bar */}
      <section
        className="section-animate-in flex flex-wrap gap-3"
        style={{ "--section-index": 1 } as React.CSSProperties}
      >
        <Card
          className="card-animate-in card-spotlight card-interactive flex-1 basis-0 min-w-[45%] md:min-w-0 border-border/70 bg-card/60 hover:border-border hover:bg-card/90 shadow-none"
          style={{ "--stagger-index": 0 } as React.CSSProperties}
        >
          <CardContent className="relative z-10 p-4 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <BookOpen className="h-3.5 w-3.5" />
              <span>{t.stats.totalPosts}</span>
            </div>
            <div className="text-2xl font-semibold tracking-tight text-foreground font-mono">
              {stats.totalPosts}{" "}
              <span className="text-xs font-normal text-muted-foreground font-sans">{t.stats.posts}</span>
            </div>
          </CardContent>
        </Card>

        <Card
          className="card-animate-in card-spotlight card-interactive flex-1 basis-0 min-w-[45%] md:min-w-0 border-border/70 bg-card/60 hover:border-border hover:bg-card/90 shadow-none"
          style={{ "--stagger-index": 1 } as React.CSSProperties}
        >
          <CardContent className="relative z-10 p-4 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <FileText className="h-3.5 w-3.5" />
              <span>{t.stats.totalWords}</span>
            </div>
            <div className="text-2xl font-semibold tracking-tight text-foreground font-mono">
              {stats.totalWordCount.toLocaleString(locale === "zh" ? "zh-CN" : "en-US")}{" "}
              <span className="text-xs font-normal text-muted-foreground font-sans">
                {t.stats.words}
              </span>
            </div>
          </CardContent>
        </Card>

        <SiteUpvCards />
      </section>

      {/* Search Trigger Bar */}
      <section
        id="search"
        className="section-animate-in space-y-3"
        style={{ "--section-index": 2 } as React.CSSProperties}
      >
        <div
          id="archive-search-input"
          role="button"
          tabIndex={0}
          onClick={openSearch}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openSearch();
            }
          }}
          className="group relative flex h-11 w-full cursor-pointer items-center justify-between rounded-xl border border-border/80 bg-card/60 px-3.5 text-sm text-muted-foreground transition-all hover:border-primary/50 hover:bg-card/90 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <div className="flex items-center gap-2.5">
            <Search className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <span>{t.search.placeholder}</span>
          </div>

          <div className="flex items-center gap-1 font-mono text-[11px]">
            <kbd className="hidden sm:inline-flex h-5 items-center rounded border border-border bg-muted/80 px-1.5 text-[10px] text-muted-foreground">
              ⌘K
            </kbd>
          </div>
        </div>
      </section>

      {/* Chronological Timeline */}
      <section className="space-y-16">
        {postsByYear.map(([year, yearPosts]) => (
          <div key={year} className="relative space-y-4">
            {/* Antfu-style Big Background Year Watermark Header */}
            <div className="relative h-16 sm:h-20 select-none pointer-events-none flex items-end justify-between pb-2 border-b border-border/40">
              <span
                aria-hidden="true"
                className="absolute -left-2 sm:-left-6 -top-6 sm:-top-10 font-mono text-7xl sm:text-8xl md:text-[8.5rem] font-black tracking-tight leading-none text-transparent stroke-year"
              >
                {year}
              </span>
              <span className="sr-only">{year}</span>
              <Badge
                variant="secondary"
                className="relative z-10 text-xs px-2.5 py-0.5 font-normal ml-auto pointer-events-auto"
              >
                {yearPosts.length} {t.stats.posts}
              </Badge>
            </div>

            {/* Timeline Items */}
            <div className="relative z-10 border-l border-border ml-2 pl-5 space-y-4">
              {yearPosts.map((post) => {
                const dateParts = post.published.split("-");
                const monthDay =
                  dateParts.length >= 3
                    ? `${dateParts[1]}-${dateParts[2]}`
                    : post.published;

                return (
                  <Link
                    key={post.slug}
                    href={`/posts/${post.slug}`}
                    className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-1.5 opacity-60 hover:opacity-100 transition-opacity duration-200 no-underline cursor-pointer"
                  >
                    <div className="absolute -left-[25px] top-2.5 h-2 w-2 rounded-full bg-border group-hover:bg-foreground group-hover:scale-125 transition-all" />

                    <div className="flex items-baseline gap-3 min-w-0">
                      <time className="font-mono text-xs text-muted-foreground w-12 shrink-0">
                        {monthDay}
                      </time>

                      <span className="text-sm font-medium text-foreground truncate">
                        {post.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground sm:shrink-0 pl-[3.75rem] sm:pl-0">
                      <span className="font-mono text-xs">
                        {formatWordCount(post.wordCount, locale)}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

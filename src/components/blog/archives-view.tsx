"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import type { Post, SiteStats, SearchIndexItem } from "@/lib/content/types";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SiteUpvCards } from "./site-upv-cards";
import { useLocale } from "@/i18n/locale-provider";
import { formatWordCount } from "@/i18n/format";
import { Search, SearchX, X, FileText, Calendar, BookOpen, ArrowRight } from "lucide-react";

interface ArchivesViewProps {
  stats: SiteStats;
  posts: Post[];
}

export function ArchivesView({ stats, posts }: ArchivesViewProps) {
  const { t, locale } = useLocale();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchIndex, setSearchIndex] = useState<SearchIndexItem[]>([]);
  const [isLoadingIndex, setIsLoadingIndex] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoadingIndex(true);

    fetch("/search-index.json")
      .then((res) => {
        if (!res.ok) throw new Error("Search index not found");
        return res.json();
      })
      .then((data: SearchIndexItem[]) => {
        if (isMounted) {
          setSearchIndex(data);
          setIsLoadingIndex(false);
        }
      })
      .catch((err) => {
        console.warn("Falling back to client-side post search:", err);
        if (isMounted) {
          const fallbackIndex: SearchIndexItem[] = posts.map((p) => ({
            slug: p.slug,
            title: p.title,
            description: p.description || p.excerpt,
            category: p.category,
            tags: p.tags,
            date: p.published,
            wordCount: p.wordCount,
            plainText: p.excerpt || "",
            locale: p.contentLocale,
          }));
          setSearchIndex(fallbackIndex);
          setIsLoadingIndex(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [posts]);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    const terms = q.split(/\s+/).filter(Boolean);

    return searchIndex.filter((item) => {
      const title = (item.title || "").toLowerCase();
      const titleEn = (item.titleEn || "").toLowerCase();
      const desc = (item.description || "").toLowerCase();
      const plain = (item.plainText || "").toLowerCase();
      const plainEn = (item.plainTextEn || "").toLowerCase();
      const category = (item.category || "").toLowerCase();
      const tags = (item.tags || []).join(" ").toLowerCase();
      const date = (item.date || "").toLowerCase();
      const year = date.split("-")[0] || "";

      return terms.every(
        (term) =>
          title.includes(term) ||
          titleEn.includes(term) ||
          desc.includes(term) ||
          plain.includes(term) ||
          plainEn.includes(term) ||
          category.includes(term) ||
          tags.includes(term) ||
          date.includes(term) ||
          year === term
      );
    });
  }, [searchQuery, searchIndex]);

  const postsByYear = useMemo(() => {
    const map = new Map<string, Post[]>();
    for (const post of posts) {
      const year = post.published.split("-")[0] || "—";
      const list = map.get(year) || [];
      list.push(post);
      map.set(year, list);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [posts]);


  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-1 pb-2">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
          {t.archives.heading}
        </h1>
        <p className="text-sm text-muted-foreground">{t.archives.subheading}</p>
      </div>

      {/* Stats Bar */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="card-spotlight card-interactive border-border/70 bg-card/60 hover:border-border hover:bg-card/90 shadow-none">
          <CardContent className="relative z-10 p-4 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <BookOpen className="h-3.5 w-3.5" />
              <span>{t.stats.totalPosts}</span>
            </div>
            <div className="text-2xl font-semibold tracking-tight text-foreground">
              {stats.totalPosts}{" "}
              <span className="text-xs font-normal text-muted-foreground">{t.stats.posts}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="card-spotlight card-interactive border-border/70 bg-card/60 hover:border-border hover:bg-card/90 shadow-none">
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

        {/* Site-wide PV and UV — both cards, or nothing when analytics are down. */}
        <SiteUpvCards />
      </section>

      {/* Search Input Bar */}
      <section className="space-y-3">
        <div className="relative flex items-center">
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.search.placeholder}
            className="pl-9 pr-9 h-10 rounded-lg bg-card/60 text-sm"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 text-muted-foreground hover:text-foreground"
              aria-label={t.search.clear}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {searchQuery && (
          <div className="text-meta text-muted-foreground px-1 flex items-center justify-between">
            <span>
              {t.search.found.replace("{count}", String(searchResults.length))}
            </span>
            {isLoadingIndex && <span className="opacity-70">({t.common.loading})</span>}
          </div>
        )}
      </section>

      {/* Search Results Display */}
      {searchQuery.trim() !== "" ? (
        <section className="space-y-3">
          {searchResults.length === 0 ? (
            <div className="p-12 text-center rounded-xl border border-border bg-card text-muted-foreground space-y-2">
              <SearchX className="mx-auto h-6 w-6 opacity-50" />
              <p className="text-sm">
                {t.search.empty}: <span className="text-foreground">{searchQuery}</span>
              </p>
              <p className="text-meta">{t.search.tip}</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {searchResults.map((item) => (
                <article
                  key={item.slug}
                  className="group rounded-lg border border-border bg-card/40 hover:bg-muted/40 p-4 transition-colors flex items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-meta text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <time className="font-mono">{item.date}</time>
                      </span>
                      {item.category && (
                        <>
                          <span>&bull;</span>
                          <Badge variant="outline" className="text-xs px-1.5 py-0">
                            {item.category}
                          </Badge>
                        </>
                      )}
                      <span>&bull;</span>
                      <span className="inline-flex items-center gap-1 font-mono">
                        <FileText className="h-3 w-3" />
                        {formatWordCount(item.wordCount, locale)}
                      </span>
                    </div>

                    <h3 className="text-base font-medium text-foreground group-hover:underline decoration-1 underline-offset-4 truncate">
                      <Link href={`/posts/${item.slug}`}>{item.title}</Link>
                    </h3>

                    {item.description && (
                      <p className="text-meta text-muted-foreground line-clamp-1">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <Link
                    href={`/posts/${item.slug}`}
                    className="shrink-0 p-1.5 text-muted-foreground group-hover:text-foreground transition-colors"
                    aria-label={`${t.common.readMore}: ${item.title}`}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : (
        /* Chronological Timeline */
        <section className="space-y-10">
          {postsByYear.map(([year, yearPosts]) => (
            <div key={year} className="space-y-4">
              {/* Year Heading */}
              <div className="flex items-center gap-2.5 pb-2 border-b border-border">
                <h2 className="text-xl font-semibold tracking-tight text-foreground font-mono">
                  {year}
                </h2>
                <Badge variant="secondary" className="text-xs px-2 py-0 font-normal">
                  {yearPosts.length} {t.stats.posts}
                </Badge>
              </div>

              {/* Timeline Items */}
              <div className="relative border-l border-border ml-2 pl-5 space-y-4">
                {yearPosts.map((post) => {
                  const dateParts = post.published.split("-");
                  const monthDay =
                    dateParts.length >= 3
                      ? `${dateParts[1]}-${dateParts[2]}`
                      : post.published;

                  return (
                    <div
                      key={post.slug}
                      className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-1"
                    >
                      {/* Timeline Dot */}
                      <div className="absolute -left-[25px] top-2.5 h-2 w-2 rounded-full bg-border group-hover:bg-foreground transition-colors" />

                      <div className="flex items-baseline gap-3 min-w-0">
                        {/* Month-Day */}
                        <time className="font-mono text-xs text-muted-foreground w-12 shrink-0">
                          {monthDay}
                        </time>

                        {/* Title */}
                        <Link
                          href={`/posts/${post.slug}`}
                          className="text-sm font-medium text-foreground hover:underline decoration-1 underline-offset-4 truncate"
                        >
                          {post.title}
                        </Link>
                      </div>

                      {/* Meta */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground sm:shrink-0 pl-15 sm:pl-0">
                        {post.category && (
                          <Badge
                            variant="outline"
                            className="text-xs px-1.5 py-0 font-normal"
                          >
                            {post.category}
                          </Badge>
                        )}
                        <span className="font-mono text-xs">
                          {formatWordCount(post.wordCount, locale)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

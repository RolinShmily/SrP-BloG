"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import type { Post, TagInfo } from "@/lib/content/types";
import { PostCard } from "./post-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/i18n/locale-provider";
import { Tag, X, Sparkles } from "lucide-react";

interface TagsViewProps {
  posts: Post[];
  tags: TagInfo[];
}

/**
 * Tags-only browser: a tag cloud, click-to-filter and a `?tag=` deep link.
 * The category section/filter that used to live here was removed in the
 * route refactor (categories are no longer a navigation concept).
 */
export function TagsView({ posts, tags }: TagsViewProps) {
  const { t } = useLocale();
  const searchParams = useSearchParams();
  const initialTag = searchParams.get("tag");

  const [selectedTag, setSelectedTag] = useState<string | null>(initialTag);

  useEffect(() => {
    setSelectedTag(initialTag);
  }, [initialTag]);

  const handleSelectTag = (tagName: string) => {
    if (selectedTag === tagName) {
      setSelectedTag(null);
      window.history.replaceState(null, "", "/tags/");
    } else {
      setSelectedTag(tagName);
      window.history.replaceState(null, "", `/tags/?tag=${encodeURIComponent(tagName)}`);
    }
  };

  const clearFilter = () => {
    setSelectedTag(null);
    window.history.replaceState(null, "", "/tags/");
  };

  const filteredPosts = useMemo(() => {
    if (selectedTag) {
      return posts.filter((p) => p.tags.includes(selectedTag));
    }
    return posts;
  }, [posts, selectedTag]);

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-1 pb-2">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
          {t.pages.tags.title}
        </h1>
        <p className="text-sm text-muted-foreground">{t.tags.subheading}</p>
      </div>

      {/* Tags Flow */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <Tag className="h-3.5 w-3.5" />
          <span>
            {t.tags.all} ({tags.length})
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 p-4 rounded-xl border border-border bg-card/40">
          {tags.length === 0 ? (
            <span className="text-sm text-muted-foreground">{t.tags.empty}</span>
          ) : (
            tags.map((tag) => {
              const isSelected = selectedTag === tag.name;
              return (
                <button
                  key={tag.name}
                  type="button"
                  onClick={() => handleSelectTag(tag.name)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-meta transition-colors border ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary font-medium"
                      : "bg-background text-muted-foreground hover:text-foreground hover:bg-muted border-border"
                  }`}
                >
                  <span>#{tag.name}</span>
                  <span
                    className={`text-xs font-mono ${
                      isSelected ? "opacity-80" : "opacity-60"
                    }`}
                  >
                    {tag.count}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </section>

      {/* Filter Status Bar & Posts List */}
      <section className="space-y-6 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            {selectedTag ? (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">{t.tags.filterLabel}:</span>
                <Badge variant="default" className="text-xs font-medium">
                  #{selectedTag}
                </Badge>
                <span className="text-meta text-muted-foreground">
                  ({filteredPosts.length} {t.stats.posts})
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4" />
                <span>
                  {t.pages.posts.title} ({posts.length} {t.stats.posts})
                </span>
              </div>
            )}
          </div>

          {selectedTag && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilter}
              className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
              <span>{t.tags.clearFilter}</span>
            </Button>
          )}
        </div>

        {/* Filtered Posts Stream */}
        {filteredPosts.length === 0 ? (
          <div className="p-12 text-center rounded-xl border border-border bg-card text-muted-foreground space-y-3">
            <p className="text-sm">{t.tags.emptyFiltered}</p>
            <Button variant="outline" size="sm" onClick={clearFilter} className="text-xs">
              {t.tags.clearFilter}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPosts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

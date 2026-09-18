"use client";

import { useState, useRef } from "react";
import type { Post } from "@/lib/content/types";
import { PostCard } from "./post-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/i18n/locale-provider";
import { siteConfig } from "@/config/site";
import { ChevronLeft, ChevronRight, Newspaper } from "lucide-react";

interface PostsListProps {
  posts: Post[];
  pageSize?: number;
}

export function PostsList({ posts, pageSize = siteConfig.postsPerPage ?? 8 }: PostsListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useLocale();

  const totalPages = Math.ceil(posts.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const currentPosts = posts.slice(startIndex, startIndex + pageSize);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (containerRef.current) {
      const top = containerRef.current.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Posts Section Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2.5">
          <Newspaper className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            {t.pages.posts.title}
          </h2>
          <Badge
            variant="secondary"
            className="px-2 py-0 text-xs font-normal"
          >
            {posts.length} {t.stats.posts}
          </Badge>
        </div>
        <div className="text-meta text-muted-foreground">
          {t.pagination.page.replace("{page}", String(currentPage))} /{" "}
          {t.pagination.of.replace("{total}", String(totalPages || 1))}
        </div>
      </div>

      {/* Posts Grid / Stack */}
      <div className="space-y-3">
        {currentPosts.map((post, idx) => (
          <div
            key={post.slug}
            className="card-animate-in"
            style={{ "--stagger-index": idx } as React.CSSProperties}
          >
            <PostCard post={post} priorityImage={idx < 2} />
          </div>
        ))}
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <nav
          aria-label={t.pagination.label}
          className="flex flex-wrap items-center justify-center gap-2 pt-6 pb-2"
        >
          {/* Previous Page Button */}
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
            className="h-8 gap-1 px-2.5 text-meta"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>{t.pagination.prev}</span>
          </Button>

          {/* Page Number Buttons */}
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
              const isActive = pageNum === currentPage;
              return (
                <Button
                  key={pageNum}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                  className="h-8 w-8 p-0 text-meta font-mono"
                  aria-current={isActive ? "page" : undefined}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          {/* Next Page Button */}
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
            className="h-8 gap-1 px-2.5 text-meta"
          >
            <span>{t.pagination.next}</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </nav>
      )}
    </div>
  );
}

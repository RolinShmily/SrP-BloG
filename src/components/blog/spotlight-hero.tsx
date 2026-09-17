import Link from "next/link";
import Image from "next/image";
import type { Post } from "@/lib/content/types";
import { Badge } from "@/components/ui/badge";
import { T } from "@/components/i18n/t";
import { dictionaries } from "@/i18n";
import { formatReadingTime, formatWordCount } from "@/i18n/format";
import { Pin, Calendar, Clock, FileText } from "lucide-react";
import { PreviewArrow } from "./preview-arrow";

interface SpotlightHeroProps {
  post: Post;
}

/**
 * Featured (pinned) post.
 *
 * Same card language as the listing below it — cover art bleeding into the
 * surface behind the copy, whole card clickable, animated arrow on the trailing
 * edge — only scaled up and set on a solid, rather than translucent, surface so
 * the featured slot still reads as the louder one.
 */
export function SpotlightHero({ post }: SpotlightHeroProps) {
  return (
    <section className="card-spotlight card-interactive group relative mb-10 overflow-hidden rounded-xl border border-border bg-card/80 hover:border-border hover:bg-card">
      {post.image && (
        <div className="blend-cover pointer-events-none absolute inset-x-0 top-0 z-0 h-2/3 sm:inset-y-0 sm:left-auto sm:h-full sm:w-3/5">
          <Image
            src={post.image}
            alt=""
            fill
            priority
            sizes="(max-width: 640px) 100vw, 600px"
            className="object-cover opacity-40 transition-opacity duration-300 group-hover:opacity-60"
          />
        </div>
      )}

      <div className="relative z-10 flex flex-col gap-3 p-6 sm:p-8 sm:pe-[38%]">
        {/* Top row: pinned flag, category, date */}
        <div className="flex flex-wrap items-center gap-2 text-meta">
          <Badge variant="secondary" className="gap-1 px-2 py-0.5 text-xs font-medium">
            <Pin className="h-3 w-3 text-[#f75c7e]" />
            <T zh={dictionaries.zh.post.pinned} en={dictionaries.en.post.pinned} />
          </Badge>

          {post.category && (
            <Badge variant="outline" className="px-2 py-0.5 text-xs font-normal">
              {post.category}
            </Badge>
          )}

          <span className="inline-flex items-center gap-1 text-meta text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <time className="font-mono">{post.published}</time>
          </span>
        </div>

        {/* Heading */}
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground transition-colors duration-200 group-hover:text-[#f75c7e]">
          {post.title}
        </h2>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 sm:line-clamp-3">
            {post.excerpt}
          </p>
        )}

        {/* Meta & tags */}
        <div className="flex flex-wrap items-center gap-3 pt-1 text-meta text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <FileText className="h-3.5 w-3.5" />
            <T zh={formatWordCount(post.wordCount, "zh")} en={formatWordCount(post.wordCount, "en")} />
          </span>
          <span className="text-muted-foreground/40">&bull;</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <T
              zh={formatReadingTime(post.readingTime, post.wordCount, "zh")}
              en={formatReadingTime(post.readingTime, post.wordCount, "en")}
            />
          </span>

          {post.tags.length > 0 && (
            <>
              <span className="text-muted-foreground/40">&bull;</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {post.tags.slice(0, 3).map((tag) => (
                  // Raised above the stretched overlay link so tags stay clickable.
                  <Link
                    key={tag}
                    href={`/tags/?tag=${encodeURIComponent(tag)}`}
                    className="relative z-20 text-meta transition-colors hover:text-foreground"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <span className="pointer-events-none absolute end-6 top-1/2 z-10 hidden -translate-y-1/2 text-muted-foreground transition-colors group-hover:text-foreground sm:block">
        <PreviewArrow />
      </span>

      <Link
        href={`/posts/${post.slug}`}
        className="absolute inset-0 z-10 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label={post.title}
      />
    </section>
  );
}

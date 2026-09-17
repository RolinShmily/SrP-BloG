import Link from "next/link";
import Image from "next/image";
import type { Post } from "@/lib/content/types";
import { Badge } from "@/components/ui/badge";
import { T } from "@/components/i18n/t";
import { dictionaries } from "@/i18n";
import { formatReadingTime, formatWordCount } from "@/i18n/format";
import { Pin, Calendar, Clock, FileText } from "lucide-react";
import { PreviewArrow } from "./preview-arrow";

interface PostCardProps {
  post: Post;
  priorityImage?: boolean;
}

/**
 * Listing card whose cover art bleeds into the surface behind the text.
 *
 * The image is not framed: it sits on the card's trailing edge and is faded out
 * toward the reading side by the `.blend-cover` mask, so the artwork and the
 * card read as one plane. Everything stays on the card's own greyscale surface —
 * hovering deepens the surface rather than tinting it per post.
 *
 * The card is made fully clickable with a stretched overlay link instead of
 * wrapping the markup in an anchor, which would nest the tag links illegally.
 */
export function PostCard({ post, priorityImage = false }: PostCardProps) {
  return (
    <article className="card-spotlight card-interactive group relative overflow-hidden rounded-xl border border-border/60 bg-card/40 hover:border-border hover:bg-card/75">
      {/* Cover art: a top band on narrow screens, a trailing-edge panel on wide. */}
      {post.image && (
        <div className="blend-cover pointer-events-none absolute inset-x-0 top-0 z-0 h-2/3 sm:inset-y-0 sm:left-auto sm:h-full sm:w-3/5">
          <Image
            src={post.image}
            alt=""
            fill
            priority={priorityImage}
            sizes="(max-width: 640px) 100vw, 420px"
            className="object-cover opacity-45 transition-opacity duration-300 group-hover:opacity-70"
          />
        </div>
      )}

      <div className="relative z-10 flex flex-col gap-2 p-5 sm:p-6 sm:pe-[38%]">
        {/* Meta line: pinned flag, date, category */}
        <div className="flex flex-wrap items-center gap-2 text-meta">
          {post.pinned && (
            <Badge variant="secondary" className="gap-1 px-1.5 py-0 text-xs font-medium">
              <Pin className="h-3 w-3 text-[#f75c7e]" />
              <T zh={dictionaries.zh.post.pinned} en={dictionaries.en.post.pinned} />
            </Badge>
          )}

          <span className="inline-flex items-center gap-1 text-meta text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <time className="font-mono text-meta text-muted-foreground">{post.published}</time>
          </span>

          {post.category && (
            <>
              <span className="text-muted-foreground/40">&bull;</span>
              <Badge variant="outline" className="px-2 py-0 text-xs font-normal">
                {post.category}
              </Badge>
            </>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg sm:text-xl font-medium tracking-tight text-foreground transition-colors duration-200 group-hover:text-[#f75c7e]">
          {post.title}
        </h3>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {post.excerpt}
          </p>
        )}

        {/* Meta footer: word count, reading time, tags */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1 text-meta text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <FileText className="h-3.5 w-3.5" />
            <T
              zh={formatWordCount(post.wordCount, "zh")}
              en={formatWordCount(post.wordCount, "en")}
            />
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
                    className="relative z-20 text-meta text-muted-foreground/80 transition-colors hover:text-foreground"
                  >
                    #{tag}
                  </Link>
                ))}
                {post.tags.length > 3 && (
                  <span className="text-xs text-muted-foreground/50">
                    +{post.tags.length - 3}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Affordance: sits on the card's trailing edge, clear of the text column. */}
      <span className="pointer-events-none absolute end-5 top-1/2 z-10 hidden -translate-y-1/2 text-muted-foreground transition-colors group-hover:text-foreground sm:block">
        <PreviewArrow />
      </span>

      {/* Stretched link: makes the whole card activate without nesting anchors. */}
      <Link
        href={`/posts/${post.slug}`}
        className="absolute inset-0 z-10 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label={post.title}
      />
    </article>
  );
}

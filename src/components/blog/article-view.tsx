"use client";

import Link from "next/link";
import Image from "next/image";
import type { PostDetail } from "@/lib/content/types";
import { tagPageHref } from "@/lib/tag-routes";
import { useLocale } from "@/i18n/locale-provider";
import { formatReadingTime, formatWordCount } from "@/i18n/format";
import { ArticleContent } from "./article-content";
import { ArticleCopyright } from "./article-copyright";
import { openImagePreview } from "./image-previewer";
import { MobileToc, DesktopToc } from "./toc";
import { LocalizedUPVCounter } from "./localized-upv-counter";
import { PreviewArrow } from "./preview-arrow";
import { WalineComments } from "./waline-comments";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  FileText,
  Hash,
  Pin,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

interface ArticleViewProps {
  post: PostDetail;
}

/**
 * Full article renderer.
 *
 * The header follows the reference theme's order — artwork first, then the
 * provenance line, then the headline and its standfirst — with the table of
 * contents beside the whole article rather than beside the body alone.
 */
export function ArticleView({ post }: ArticleViewProps) {
  const { t, locale } = useLocale();

  const minutes = formatReadingTime(post.readingTime, post.wordCount, locale);
  const words = formatWordCount(post.wordCount, locale);
  const standfirst = post.description || post.excerpt;

  // Check if article is older than 1 year (strictly prioritizes `updated` date)
  const isExplicitlyUpdated = Boolean(post.updated && post.updated !== post.published);
  const effectiveDateStr = post.updated || post.published;
  const effectiveTimestamp = new Date(effectiveDateStr).getTime();
  const diffDays = Math.floor((Date.now() - effectiveTimestamp) / (1000 * 60 * 60 * 24));
  const yearsAgo = Math.floor(diffDays / 365);

  return (
    <>
      {/* Back Link */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="h-8 gap-1 px-2 text-sm text-muted-foreground hover:text-foreground">
          <Link href="/posts">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>{t.post.backToList}</span>
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-10 xl:flex-row xl:items-start">
        <article className="min-w-0 flex-1" data-pagefind-body>
          {/* Cover art, with a blurred copy blooming out from behind the frame */}
          {post.image && (
            <div className="relative mb-6">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-6 -inset-y-2 z-0 opacity-50"
              >
                <div
                  className="absolute inset-0 rounded-3xl blur-2xl"
                  style={{
                    backgroundImage: `url(${JSON.stringify(post.image)})`,
                    backgroundPosition: "center",
                    backgroundSize: "cover",
                  }}
                />
              </div>
              <div
                role="button"
                tabIndex={0}
                title={post.title}
                onClick={() =>
                  openImagePreview({
                    images: [{ src: post.image!, alt: post.title }],
                    initialIndex: 0,
                  })
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openImagePreview({
                      images: [{ src: post.image!, alt: post.title }],
                      initialIndex: 0,
                    });
                  }
                }}
                className="group relative z-10 aspect-[16/9] w-full cursor-zoom-in overflow-hidden rounded-2xl border border-border/60 bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 720px"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            </div>
          )}

          {/* Provenance line: pinned flag, dates, effort, readership and tags */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-meta text-muted-foreground font-mono">
            {post.pinned && (
              <Badge variant="secondary" className="gap-1 px-1.5 py-0 text-xs font-medium">
                <Pin className="h-3 w-3 text-[#f75c7e]" />
                <span>{t.post.pinned}</span>
              </Badge>
            )}

            <span className="inline-flex items-center gap-1" title={`${t.post.publishedAt}: ${post.published}`}>
              <Calendar className="h-3.5 w-3.5" />
              <time className="font-mono" dateTime={post.published}>{post.published}</time>
              {post.updated && post.updated !== post.published && (
                <span className="inline-flex items-center gap-1" title={`${t.post.updatedAt}: ${post.updated}`}>
                  <span className="opacity-50">/</span>
                  <RefreshCw className="h-3 w-3" />
                  <time className="font-mono" dateTime={post.updated}>{post.updated}</time>
                </span>
              )}
            </span>

            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{minutes}</span>
            </span>

            <span className="inline-flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              <span className="font-mono">{words}</span>
            </span>

            <LocalizedUPVCounter path={`/posts/${post.slug}`} />

            {post.tags.length > 0 && (
              <span className="inline-flex flex-wrap items-center gap-1.5">
                <Hash className="h-3.5 w-3.5" />
                {post.tags.map((tag, index) => (
                  <span key={tag} className="inline-flex items-center gap-1.5">
                    <Link
                      href={tagPageHref(tag)}
                      className="transition-colors hover:text-foreground hover:underline underline-offset-4"
                    >
                      {tag}
                    </Link>
                    {index < post.tags.length - 1 && <span className="opacity-40">/</span>}
                  </span>
                ))}
              </span>
            )}
          </div>

          {/* Headline */}
          <h1
            data-pagefind-meta="title"
            className="mt-4 text-2xl font-semibold tracking-tight text-foreground leading-tight sm:mt-5 sm:text-3xl lg:text-4xl"
          >
            {post.title}
          </h1>

          {/* Standfirst, quoted from the frontmatter description */}
          {standfirst && (
            <blockquote className="mt-3 text-sm italic leading-relaxed text-muted-foreground">
              <q>{standfirst}</q>
            </blockquote>
          )}

          {/* Dividing rule: deliberately short so it reads as a flourish */}
          <div className="mt-5 w-1/2 border-t border-border sm:mt-6 sm:w-1/3" />

          {/* Outdated Notice (if older than 1 year, based on updated date) */}
          {yearsAgo >= 1 && (
            <div
              data-pagefind-ignore
              className="mt-6 flex items-start gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-xs text-amber-600 dark:text-amber-400 leading-relaxed"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <p>
                {(isExplicitlyUpdated
                  ? t.post.outdatedNotice
                  : t.post.outdatedNoticePublished
                ).replace("{years}", String(yearsAgo))}
              </p>
            </div>
          )}

          {/* Body */}
          <div id="article-content" className="mt-8 min-w-0">
            <div data-pagefind-ignore>
              <MobileToc toc={post.toc} />
            </div>
            <ArticleContent html={post.contentHtml} />
          </div>

          <div data-pagefind-ignore>
            {/* Provenance card, then the neighbouring posts */}
            <ArticleCopyright post={post} />

            <footer className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-between">
              {post.prevPost ? (
                <Link
                  href={`/posts/${post.prevPost.slug}`}
                  className="group flex min-w-0 items-center gap-x-2 rounded-xl px-4 py-2 transition-colors duration-300 hover:bg-muted max-sm:max-w-[80%]"
                >
                  <PreviewArrow className="rotate-180 text-muted-foreground transition-colors group-hover:text-foreground" />
                  <span className="truncate text-sm font-medium text-foreground">
                    {post.prevPost.title}
                  </span>
                </Link>
              ) : (
                <span className="hidden sm:block" />
              )}

              {post.nextPost ? (
                <Link
                  href={`/posts/${post.nextPost.slug}`}
                  className="group flex min-w-0 items-center gap-x-2 rounded-xl px-4 py-2 transition-colors duration-300 hover:bg-muted max-sm:ms-auto max-sm:max-w-[80%] sm:text-right"
                >
                  <span className="truncate text-sm font-medium text-foreground">
                    {post.nextPost.title}
                  </span>
                  <PreviewArrow className="text-muted-foreground transition-colors group-hover:text-foreground" />
                </Link>
              ) : (
                <span className="hidden sm:block" />
              )}
            </footer>

            {/* Waline Comments Section */}
            <WalineComments path={`/posts/${post.slug}`} />
          </div>
        </article>

        {/* Table of contents, spanning the header and the body */}
        <DesktopToc toc={post.toc} />
      </div>
    </>
  );
}

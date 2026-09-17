"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { PostDetail } from "@/lib/content/types";
import type { Locale } from "@/i18n/types";
import { useLocale } from "@/i18n/locale-provider";
import { formatReadingTime, formatWordCount } from "@/i18n/format";
import { ArticleContent } from "./article-content";
import { ArticleCopyright } from "./article-copyright";
import { MobileToc, DesktopToc } from "./toc";
import { LocalizedUPVCounter } from "./localized-upv-counter";
import { PreviewArrow } from "./preview-arrow";
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
  Languages,
} from "lucide-react";

interface ArticleViewProps {
  post: PostDetail;
}

/**
 * Full article renderer with the per-post machine-translation toggle.
 *
 * Rendering happens server-side first (defaults to the original Chinese
 * content), then this client component can swap to the pre-rendered English
 * bundle (`post.translations.en`) without any network request. Only the body
 * HTML, TOC, word count and reading time switch; the title/tags stay canonical.
 *
 * The header follows the reference theme's order — artwork first, then the
 * provenance line, then the headline and its standfirst — with the table of
 * contents beside the whole article rather than beside the body alone.
 */
export function ArticleView({ post }: ArticleViewProps) {
  const { t } = useLocale();
  const enBundle = post.translations.en;
  const canToggle = post.availableLocales.includes("en") && Boolean(enBundle);
  const [showMachine, setShowMachine] = useState(false);

  const showEnglish = canToggle && showMachine && Boolean(enBundle);
  const active = showEnglish && enBundle
    ? enBundle
    : {
        contentHtml: post.contentHtml,
        toc: post.toc,
        wordCount: post.wordCount,
        readingTime: post.readingTime,
      };

  // Stats/units follow the language of the content currently displayed.
  const contentLocale: Locale = showEnglish ? "en" : post.contentLocale;
  const minutes = formatReadingTime(active.readingTime, active.wordCount, contentLocale);
  const words = formatWordCount(active.wordCount, contentLocale);
  const standfirst = post.description || post.excerpt;

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
        <article className="min-w-0 flex-1">
          {/* Cover art, with a blurred copy blooming out from behind the frame */}
          {post.image && (
            <div className="relative mb-6">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-6 -inset-y-2 z-0 opacity-50"
              >
                <Image
                  src={post.image}
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 100vw, 720px"
                  className="rounded-3xl object-cover blur-2xl"
                />
              </div>
              <div className="relative z-10 aspect-[16/9] w-full overflow-hidden rounded-2xl border border-border/60 bg-muted/30">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 720px"
                  className="object-cover"
                />
              </div>
            </div>
          )}

          {/* Provenance line: pinned flag, dates, effort, readership and tags */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-meta text-muted-foreground">
            {post.pinned && (
              <Badge variant="secondary" className="gap-1 px-1.5 py-0 text-xs font-medium">
                <Pin className="h-3 w-3 text-[#f75c7e]" />
                <span>{t.post.pinned}</span>
              </Badge>
            )}

            {post.category && (
              <Badge variant="outline" className="px-2 py-0 text-xs font-normal">
                {post.category}
              </Badge>
            )}

            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <time className="font-mono">{post.published}</time>
              {post.updated && (
                <>
                  <span className="opacity-50">/</span>
                  <RefreshCw className="h-3 w-3" />
                  <time className="font-mono">{post.updated}</time>
                </>
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
                      href={`/tags/?tag=${encodeURIComponent(tag)}`}
                      className="transition-colors hover:text-foreground hover:underline underline-offset-4"
                    >
                      {tag}
                    </Link>
                    {index < post.tags.length - 1 && <span className="opacity-40">/</span>}
                  </span>
                ))}
              </span>
            )}

            {showEnglish && (
              <Badge variant="outline" className="gap-1 px-1.5 py-0 text-xs font-normal">
                <Languages className="h-2.5 w-2.5" />
                {t.translation.machine}
              </Badge>
            )}
          </div>

          {/* Headline */}
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground leading-tight sm:mt-5 sm:text-3xl lg:text-4xl">
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

          {/* Machine-translation toggle + notice */}
          {canToggle && (
            <div className="mt-6 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMachine((value) => !value)}
                  className="h-8 gap-1.5 text-sm"
                  aria-pressed={showMachine}
                >
                  <Languages className="h-3.5 w-3.5" />
                  <span>{showMachine ? t.translation.hideMachine : t.translation.showMachine}</span>
                </Button>
              </div>

              {showEnglish && (
                <div
                  role="note"
                  className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-meta text-amber-700 dark:text-amber-300"
                >
                  {t.translation.notice}
                </div>
              )}
            </div>
          )}

          {/* Body */}
          <div id="article-content" className="mt-8 min-w-0">
            <MobileToc toc={active.toc} />
            <ArticleContent html={active.contentHtml} />
          </div>

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
        </article>

        {/* Table of contents, spanning the header and the body */}
        <DesktopToc toc={active.toc} />
      </div>
    </>
  );
}

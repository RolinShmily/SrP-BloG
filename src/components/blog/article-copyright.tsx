"use client";

import { useState } from "react";
import Link from "next/link";
import type { PostDetail } from "@/lib/content/types";
import { siteConfig } from "@/config/site";
import { useLocale } from "@/i18n/locale-provider";
import { cn } from "@/lib/utils";
import { Copyright, Link2, Check, Coffee } from "lucide-react";

interface ArticleCopyrightProps {
  post: PostDetail;
}

/**
 * End-of-article provenance card.
 *
 * Reproduces the reference theme's closing block: a watermark glyph in the
 * corner, the work's identity (title + canonical URL), a row of labelled
 * provenance fields, and the actions a reader is most likely to want at the end
 * of a piece. A half-height tab hanging off the bottom edge carries the
 * sponsorship call to action, mirroring the reference theme — it points at the
 * `#sponsors` section of the friends page rather than at a dedicated page.
 */
export function ArticleCopyright({ post }: ArticleCopyrightProps) {
  const { t } = useLocale();
  const [copied, setCopied] = useState(false);

  const canonicalUrl = `${siteConfig.url}/posts/${post.slug}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(canonicalUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be denied (insecure context, missing permission).
      // Surfacing the URL is enough of a fallback; leave the button state alone.
    }
  };

  const fields = [
    { label: t.post.author, value: siteConfig.author },
    { label: t.post.publishedAt, value: post.published },
    {
      label: t.post.copyright,
      value: siteConfig.license.name,
      href: siteConfig.license.url,
    },
  ];

  return (
    <div className="mt-14">
      <div className="relative flex flex-col gap-y-3 overflow-hidden rounded-xl border border-border/60 bg-card/40 px-4 py-3.5 sm:px-5 sm:py-4">
        {/* Watermark: decorative only, kept far below text contrast on purpose. */}
        <Copyright
          aria-hidden="true"
          strokeWidth={1.25}
          className="pointer-events-none absolute end-4 top-4 h-16 w-16 text-foreground opacity-[0.07] sm:h-20 sm:w-20"
        />

        <div className="flex min-w-0 flex-col gap-0.5 pe-20">
          <p className="text-sm font-medium text-foreground line-clamp-2">{post.title}</p>
          <p className="font-mono text-xs text-muted-foreground line-clamp-1">
            {canonicalUrl}
          </p>
        </div>

        <dl className="flex flex-wrap items-start gap-x-8 gap-y-2">
          {fields.map((field) => (
            <div key={field.label} className="flex flex-col gap-0.5">
              <dt className="text-xs text-muted-foreground">{field.label}</dt>
              <dd className="text-meta text-foreground">
                {field.href ? (
                  <a
                    href={field.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#f75c7e] transition-colors"
                  >
                    {field.value}
                  </a>
                ) : (
                  field.value
                )}
              </dd>
            </div>
          ))}
        </dl>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            aria-label={t.post.copyLink}
            title={copied ? t.post.linkCopied : t.post.copyLink}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1.5 text-xs transition-colors",
              copied
                ? "text-[#f75c7e]"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
            <span>{copied ? t.post.linkCopied : t.post.copyLink}</span>
          </button>
        </div>
      </div>

      {/* Tab hanging off the card's bottom edge — reads as part of the same card. */}
      <div className="mx-6 rounded-b-xl border border-t-0 border-border/60 px-4 pb-1.5 pt-1 sm:mx-8">
        <Link
          href="/friends#sponsors"
          className="flex w-full items-center justify-between text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <span>{t.sponsors.coffee}</span>
          <Coffee className="box-content h-3.5 w-3.5 p-1" />
        </Link>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useLocale } from "@/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { openSearch } from "@/components/blog/search-dialog";
import { Home, Search, ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  const { t } = useLocale();

  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center select-none">
      <div className="relative flex flex-col items-center max-w-md w-full space-y-6">
        {/* Antfu / Zinc Art Background 404 Watermark */}
        <div className="relative flex items-center justify-center">
          <span
            aria-hidden="true"
            className="font-mono text-8xl sm:text-9xl font-black tracking-tighter text-transparent stroke-year opacity-70"
          >
            404
          </span>
        </div>

        {/* Headline & Description */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
            {t.pages.notFound.title}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t.pages.notFound.description}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button asChild variant="default" className="gap-2 rounded-xl">
            <Link href="/">
              <Home className="h-4 w-4" />
              <span>{t.nav.home}</span>
            </Link>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={openSearch}
            className="gap-2 rounded-xl border-border/80 hover:bg-muted/60"
          >
            <Search className="h-4 w-4 text-muted-foreground" />
            <span>{t.common.search}</span>
            <kbd className="hidden sm:inline-flex h-4 items-center rounded border border-border bg-muted/80 px-1 font-mono text-[9px] text-muted-foreground">
              ⌘K
            </kbd>
          </Button>
        </div>
      </div>
    </main>
  );
}

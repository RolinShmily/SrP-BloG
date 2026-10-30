"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useLocale } from "@/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Home, RotateCcw, AlertTriangle } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLocale();

  useEffect(() => {
    console.error("[app] Uncaught runtime error:", error);
  }, [error]);

  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center select-none">
      <div className="relative flex flex-col items-center max-w-md w-full space-y-6">
        {/* Zinc Art Background Error Watermark */}
        <div className="relative flex items-center justify-center">
          <span
            aria-hidden="true"
            className="font-mono text-8xl sm:text-9xl font-black tracking-tighter text-transparent stroke-year opacity-70"
          >
            500
          </span>
        </div>

        {/* Headline & Description */}
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 text-rose-500/90 dark:text-rose-400/90 mb-1">
            <AlertTriangle className="h-5 w-5" />
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
              {t.pages.error.title}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t.pages.error.description}
          </p>
        </div>

        {/* Error Digest/Message (compact subtle debug badge) */}
        {error?.message ? (
          <div className="w-full max-w-sm rounded-lg border border-border/60 bg-muted/40 p-2.5 text-left font-mono text-xs text-muted-foreground break-all">
            <span className="text-rose-500/80 mr-1.5 font-semibold">Error:</span>
            {error.message}
          </div>
        ) : null}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button
            type="button"
            variant="default"
            onClick={() => reset()}
            className="gap-2 rounded-xl"
          >
            <RotateCcw className="h-4 w-4" />
            <span>{t.pages.error.retry}</span>
          </Button>

          <Button asChild variant="outline" className="gap-2 rounded-xl border-border/80 hover:bg-muted/60">
            <Link href="/">
              <Home className="h-4 w-4" />
              <span>{t.nav.home}</span>
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

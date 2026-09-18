"use client";

import { useEffect, useState, useCallback } from "react";
import { ArrowUp } from "lucide-react";
import { useLocale } from "@/i18n/locale-provider";

/**
 * Floating Back-to-Top button.
 *
 * Appears in the bottom-right viewport corner when scrolled down (>300px).
 * Features smooth glassmorphism styling, theme-accented hover, touch-friendly
 * mobile sizing, and iOS safe-area adaptation.
 */
export function BackToTop() {
  const { t } = useLocale();
  const [visible, setVisible] = useState(false);

  const handleScroll = useCallback(() => {
    // Show button once user scrolls past 300px
    const shouldShow = window.scrollY > 300;
    setVisible((prev) => (prev !== shouldShow ? shouldShow : prev));
  }, []);

  useEffect(() => {
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div
      className={`fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 print:hidden transition-all duration-300 ease-out pb-[env(safe-area-inset-bottom)] pr-[env(safe-area-inset-right)] ${
        visible
          ? "opacity-100 translate-y-0 pointer-events-auto scale-100"
          : "opacity-0 translate-y-3 pointer-events-none scale-90"
      }`}
    >
      <button
        type="button"
        onClick={scrollToTop}
        aria-label={t.common.backToTop}
        title={t.common.backToTop}
        className="group flex size-9 sm:size-10 items-center justify-center rounded-full border border-border/70 bg-background/80 backdrop-blur-md text-muted-foreground shadow-sm transition-all duration-200 hover:border-primary/40 hover:bg-background/95 hover:text-primary hover:shadow-md active:scale-95 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <ArrowUp className="size-4 transition-transform duration-200 group-hover:-translate-y-0.5" />
      </button>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState, useCallback, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Route Transition Progress Bar (inspired by antfu.me / NProgress).
 *
 * Provides instant visual feedback during page transitions:
 * - Listens for internal navigation link clicks and browser history navigation (popstate)
 * - Renders a sleek, glowing 2px top bar matching the site's cherry-rose accent
 * - Trickles progress naturally while waiting for route chunk loading / rendering
 * - Flushes to 100% and smoothly fades out once the target page mounts
 */
function ProgressContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef(false);

  const complete = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    activeRef.current = false;
    setProgress(100);

    // Fade out and reset state
    setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
        setProgress(0);
      }, 250);
    }, 280);
  }, []);

  const start = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    activeRef.current = true;
    setVisible(true);
    setProgress(15);

    // Natural slowing trickle up towards 90%
    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        const remaining = 90 - prev;
        const step = Math.max(1, remaining * 0.18);
        return Math.min(prev + step, 90);
      });
    }, 120);

    // Safety fallback: auto-complete if navigation stalls or cancels
    timeoutRef.current = setTimeout(() => {
      complete();
    }, 6000);
  }, [complete]);

  // Complete progress bar when route transition finishes
  useEffect(() => {
    if (activeRef.current) {
      complete();
    }
  }, [pathname, searchParams, complete]);

  useEffect(() => {
    // Intercept internal link clicks to initiate immediate progress feedback
    const handleClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      if (e.button !== 0) return; // Only standard left clicks
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // Ignore new tab clicks

      const anchor = (e.target as HTMLElement)?.closest("a");
      if (!anchor) return;

      const target = anchor.getAttribute("target");
      if (target && target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href) return;
      if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;

      try {
        const url = new URL(anchor.href, window.location.href);
        if (url.origin !== window.location.origin) return;

        // Skip if target is the exact same path and query string (e.g. hash anchor jumps)
        if (
          url.pathname === window.location.pathname &&
          url.search === window.location.search
        ) {
          return;
        }

        start();
      } catch {
        // Invalid URL format, ignore
      }
    };

    const handlePopState = () => {
      start();
    };

    document.addEventListener("click", handleClick, { capture: true });
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
      window.removeEventListener("popstate", handlePopState);
      if (timerRef.current) clearInterval(timerRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [start]);

  if (!visible && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 pointer-events-none z-[99999]"
      style={{
        opacity: visible ? 1 : 0,
        transition: visible ? "none" : "opacity 250ms ease-out",
      }}
    >
      <div
        className="h-[2px] bg-gradient-to-r from-[#ff7eb3] via-[#f75c7e] to-[#a855f7]"
        style={{
          width: `${progress}%`,
          transition: "width 180ms cubic-bezier(0.16, 1, 0.3, 1)",
          boxShadow:
            "0 0 10px rgba(247, 92, 126, 0.8), 0 0 5px rgba(247, 92, 126, 0.6)",
        }}
      />
    </div>
  );
}

export function RouteProgressBar() {
  return (
    <Suspense fallback={null}>
      <ProgressContent />
    </Suspense>
  );
}

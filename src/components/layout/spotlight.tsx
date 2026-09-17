"use client";

import { useEffect } from "react";

/**
 * Global mouse-tracking spotlight effect for `.card-spotlight` elements.
 *
 * Inspired by Dan Arnoux's portfolio (danarnoux.com). A single passive pointermove
 * listener throttled with requestAnimationFrame computes the relative cursor position
 * within the active card and sets `--spot-x` and `--spot-y` CSS custom properties.
 *
 * Progressive enhancement:
 * - Completely dormant on touch-only devices (`(pointer: fine)` query).
 * - Bypassed when the user prefers reduced motion.
 * - Zero performance overhead when the cursor is outside `.card-spotlight` elements.
 */
export function SpotlightEffect() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let rafId = 0;
    let lastEvent: PointerEvent | null = null;

    const applySpotlight = () => {
      rafId = 0;
      const event = lastEvent;
      if (!event) return;

      const card =
        event.target instanceof Element
          ? event.target.closest<HTMLElement>(".card-spotlight")
          : null;

      if (!card) return;

      const rect = card.getBoundingClientRect();
      card.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
      card.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType && event.pointerType !== "mouse") return;
      lastEvent = event;
      if (!rafId) {
        rafId = requestAnimationFrame(applySpotlight);
      }
    };

    document.addEventListener("pointermove", handlePointerMove, { passive: true });

    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return null;
}

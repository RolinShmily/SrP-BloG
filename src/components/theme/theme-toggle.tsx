"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { flushSync } from "react-dom";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { navIconButtonClass } from "@/components/layout/nav-button";

/** Reveal timing, matching antfu.me. */
const REVEAL_DURATION = 400;
const REVEAL_EASING = "ease-out";

/**
 * Flip the theme class on <html> with CSS transitions suppressed for one frame.
 *
 * next-themes can suppress them itself through `disableTransitionOnChange`, but
 * that only runs on its own update path. We have to write the class ourselves
 * (see ThemeToggle), which bypasses it — and flipping the class bare starts
 * ~400 simultaneous `transition-colors` animations across the page, which is
 * both a style-recalc storm and a visible colour cross-fade underneath the
 * reveal.
 *
 * Transitions are suppressed only while the new class is committed; the forced
 * reflow makes the browser record the value change with nothing to interpolate,
 * so they never start at all and the guard can be dropped immediately after.
 */
function applyThemeClass(next: "light" | "dark", persist: (value: "light" | "dark") => void) {
  const style = document.createElement("style");
  style.appendChild(document.createTextNode("*{transition:none!important}"));
  document.head.appendChild(style);

  try {
    const root = document.documentElement;
    root.classList.toggle("dark", next === "dark");
    root.style.colorScheme = next;
    persist(next);

    // Force the style recalc while transitions are still disabled.
    void window.getComputedStyle(document.body).transition;
  } finally {
    window.setTimeout(() => style.remove(), 1);
  }
}

/**
 * Theme switch, styled as one of the header's bordered icon buttons.
 *
 * The light/dark flip is played as a circular reveal growing out of the click
 * point, ported from antfu.me:
 *
 * - without View Transitions, or when the user asked for reduced motion, the
 *   theme flips instantly;
 * - the radius is the distance from the pointer to the farthest viewport
 *   corner, so the sweep always covers the whole screen;
 * - *which* snapshot animates depends on the destination, because the two
 *   z-indexes swap with the `.dark` class: while switching to dark, `.dark` has
 *   already landed on `<html>`, putting the old (light) snapshot on top, so the
 *   old layer is the one whose clip-path has to shrink (see globals.css).
 *
 * The server renders the moon and the client keeps it until hydration settles,
 * so the markup matches on both sides.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  function toggleTheme(event: MouseEvent<HTMLButtonElement>) {
    const next: "light" | "dark" = isDark ? "light" : "dark";
    const persist = (value: "light" | "dark") => {
      // Commit synchronously. next-themes updates on React's own schedule, which
      // lands *after* the view transition has already captured its "new"
      // snapshot — the button would keep showing the moon throughout the whole
      // reveal. antfu.me does not hit this because Vue flushes its DOM update in
      // the same tick.
      flushSync(() => setTheme(value));
    };

    const canReveal =
      typeof document.startViewTransition === "function" &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!canReveal) {
      applyThemeClass(next, persist);
      return;
    }

    // Keyboard activation reports (0, 0); fall back to the button's centre so
    // the reveal still starts somewhere sensible.
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX || rect.left + rect.width / 2;
    const y = event.clientY || rect.top + rect.height / 2;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    const clipPath = [
      `circle(0px at ${x}px ${y}px)`,
      `circle(${endRadius}px at ${x}px ${y}px)`,
    ];

    const transition = document.startViewTransition(() => {
      // This callback must settle synchronously. Chrome does not deliver
      // requestAnimationFrame while it waits for it, so returning a
      // frame-based promise deadlocks the transition until Chrome aborts it
      // with "TimeoutError: Transition was aborted because of timeout in DOM
      // update". antfu.me ships the same shape and gets away with it only
      // because Vue's nextTick is a microtask, not a frame.
      applyThemeClass(next, persist);
    });

    transition.ready
      .then(() => {
        document.documentElement.animate(
          { clipPath: next === "dark" ? [...clipPath].reverse() : clipPath },
          {
            duration: REVEAL_DURATION,
            easing: REVEAL_EASING,
            fill: "forwards",
            pseudoElement:
              next === "dark" ? "::view-transition-old(root)" : "::view-transition-new(root)",
          },
        );
      })
      .catch((error: unknown) => {
        // Clicking again mid-reveal makes the browser skip the in-flight
        // transition, which rejects `ready` with an InvalidStateError. The
        // theme itself has already been applied, so there is nothing to undo.
        // Anything else is a real bug and should surface.
        if (!(error instanceof DOMException && error.name === "InvalidStateError")) {
          throw error;
        }
      });
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={navIconButtonClass}
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

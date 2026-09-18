"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

export interface AnimatedNumberProps {
  /** The target number to display and animate toward. */
  value: number;
  /** Optional custom number formatter (defaults to Intl.NumberFormat). */
  format?: (value: number) => string;
  /** Animation duration in milliseconds. Defaults to 600ms. */
  duration?: number;
  /** Extra CSS classes. */
  className?: string;
  /** Inline styles. */
  style?: CSSProperties;
}

/**
 * Animated number counter.
 *
 * Smoothly rolls up from 0 to the target number using requestAnimationFrame
 * with a cubic ease-out curve. Honors prefers-reduced-motion.
 */
export function AnimatedNumber({
  value,
  format = (v) => new Intl.NumberFormat().format(v),
  duration = 600,
  className,
  style,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState<number>(0);
  const prevValueRef = useRef<number>(0);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  useEffect(() => {
    const startVal = prevValueRef.current;
    const endVal = value;
    prevValueRef.current = value;

    // No animation needed if value hasn't changed
    if (startVal === endVal) return;

    // If zero or user prefers reduced motion, update immediately
    if (
      endVal === 0 ||
      (typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    ) {
      setDisplayValue(endVal);
      return;
    }

    setIsAnimating(true);
    let rafId: number;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Cubic ease-out: decelerates smoothly toward the target
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startVal + (endVal - startVal) * easeOut);
      setDisplayValue(current);

      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        setDisplayValue(endVal);
        setIsAnimating(false);
      }
    };

    rafId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(rafId);
      setIsAnimating(false);
    };
  }, [value, duration]);

  return (
    <span
      className={cn(
        "inline tabular-nums transition-opacity duration-300",
        isAnimating && "opacity-90",
        className,
      )}
      style={style}
    >
      {format(displayValue)}
    </span>
  );
}

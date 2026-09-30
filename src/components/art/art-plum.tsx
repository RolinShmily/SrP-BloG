"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { useTheme } from "next-themes";

interface ArtPlumProps {
  className?: string;
}

interface StepCounter {
  value: number;
}

type StepFn = () => void;

const r180 = Math.PI;
const r90 = Math.PI / 2;
const r15 = Math.PI / 12;

/**
 * Branch length per segment (0..N px).
 *
 * antfu.me uses 6. Growing this is the main lever for the look: the art's ink is
 * proportional to segments × length while its *reach* is proportional to
 * frames × length, so longer strokes buy far more spread per unit of ink. At 12
 * the branches sweep roughly 2.3× further from their origin than at 6 for the
 * same visual weight, which is what stops them collapsing into corner clumps.
 */
const SEGMENT_LEN = 12;
/** Below this step count a branch forks eagerly (0.8), afterwards it calms down. */
const MIN_BRANCH = 30;
/**
 * Fork probability once a branch matures.
 *
 * antfu.me uses 0.5, which makes growth a *critical* branching process (mean
 * offspring exactly 1.0). That is beautiful but unstable — it dies out with
 * probability 1, so total ink swings from ~2% to ~13% between loads. 0.52 is
 * just supercritical: the walk reliably reaches the budget instead of dying
 * early, which pins the result to a stable amount of ink.
 */
const MATURE_RATE = 0.52;
/**
 * Total segments drawn, scaled by viewport area from a 1440×900 reference.
 * Reduced by 20% (11_000 -> 8_800) to keep the spreading branches serene
 * and tranquil without encroaching too heavily into the page space.
 */
const SEGMENT_BUDGET_REF = 8_800;
/**
 * Floor on segments. Even a supercritical walk can be cut short by branches
 * leaving the viewport, so if the frontier empties this early we seed a fresh
 * origin from the edges rather than shipping a nearly blank background.
 */
const MIN_SEGMENTS_REF = 4_000;
const REF_AREA = 1440 * 900;

function polar2cart(x: number, y: number, r: number, theta: number): [number, number] {
  return [x + r * Math.cos(theta), y + r * Math.sin(theta)];
}

/**
 * 冬之寒梅 — ambient winter-plum branch art.
 *
 * Geometry is a faithful port of antfu.me's `ArtPlum.vue`: four random edge
 * origins, 0–6px segments, and a deliberately tight ±15° (`r15`) divergence for
 * both child branches. That tightness is the whole trick — branches keep flowing
 * outward collinearly instead of splaying into tangled clumps.
 *
 * Blossoms were removed by request: the art is now pure bare branches, letting
 * the sprawling twig silhouette carry the whole composition on its own.
 */
export function ArtPlum({ className = "" }: ArtPlumProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { resolvedTheme } = useTheme();
  const rafId = useRef<number | null>(null);

  const startGrowth = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    const isDark =
      resolvedTheme === "dark" ||
      document.documentElement.classList.contains("dark");

    // antfu strokes with #88888825 — alpha 0x25/255 ≈ 0.145. Matching that
    // restraint is what keeps the branches reading as fine twigs rather than
    // heavy clumps; going much above it is what makes the art look muddy.
    const branchColor = isDark
      ? "rgba(136, 136, 136, 0.17)"
      : "rgba(88, 88, 96, 0.14)";

    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = 1;
    ctx.strokeStyle = branchColor;

    // Area-scaled so a phone and a 4K screen get the same visual weight.
    const areaScale = (width * height) / REF_AREA;
    let budget = Math.max(1_500, Math.round(SEGMENT_BUDGET_REF * areaScale));
    const initialBudget = budget;
    const minSegments = Math.max(700, Math.round(MIN_SEGMENTS_REF * areaScale));

    /** True when [nx, ny] sits inside the visible canvas plus a small margin. */
    function inBounds(nx: number, ny: number): boolean {
      return nx >= -100 && nx <= width + 100 && ny >= -100 && ny <= height + 100;
    }

    let steps: StepFn[] = [];
    let prevSteps: StepFn[] = [];

    function step(
      x: number,
      y: number,
      rad: number,
      counter: StepCounter = { value: 0 }
    ) {
      if (!ctx) return;
      counter.value += 1;
      budget -= 1;

      const length = Math.random() * SEGMENT_LEN;
      const [nx, ny] = polar2cart(x, y, length, rad);

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(nx, ny);
      ctx.stroke();

      // antfu's fork angles: both children stay within ±15° of the parent, which
      // is what keeps the silhouette flowing outward instead of tangling.
      const rad1 = rad + Math.random() * r15;
      const rad2 = rad - Math.random() * r15;

      if (!inBounds(nx, ny)) return;

      // Once the budget is spent every branch simply stops forking and drains,
      // which ends the drawing without an abrupt cut.
      const rate =
        budget <= 0
          ? 0
          : counter.value <= MIN_BRANCH
            ? 0.8
            : MATURE_RATE;

      if (Math.random() < rate) {
        steps.push(() => step(nx, ny, rad1, counter));
      }
      if (Math.random() < rate) {
        steps.push(() => step(nx, ny, rad2, counter));
      }
    }

    const randomMiddle = () => Math.random() * 0.6 + 0.2;

    /** Seed branch tips along the viewport edges, as antfu.me does. */
    function seedFromEdges(): StepFn[] {
      const defs: [number, number, number][] =
        width < 500
          ? [
              [randomMiddle() * width, -5, r90],
              [randomMiddle() * width, height + 5, -r90],
            ]
          : [
              [randomMiddle() * width, -5, r90],
              [randomMiddle() * width, height + 5, -r90],
              [-5, randomMiddle() * height, 0],
              [width + 5, randomMiddle() * height, r180],
            ];
      return defs.map(([x, y, rad]) => () => step(x, y, rad));
    }

    steps = seedFromEdges();
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      // Settle the growth instantly for reduced-motion users.
      let reseeds = 0;
      while (steps.length && initialBudget - budget < minSegments && reseeds < 24) {
        prevSteps = steps;
        steps = [];
        prevSteps.forEach((fn) => fn());
        if (!steps.length) {
          reseeds += 1;
          steps = seedFromEdges();
        }
      }
      // Drain whatever is left so the frame is fully drawn.
      for (let f = 0; f < 600 && steps.length; f++) {
        prevSteps = steps;
        steps = [];
        prevSteps.forEach((fn) => fn());
      }
      return;
    }

    let lastTime = performance.now();
    const interval = 1000 / 40;
    let reseeds = 0;

    const frame = () => {
      if (performance.now() - lastTime >= interval) {
        prevSteps = steps;
        steps = [];
        lastTime = performance.now();

        if (!prevSteps.length) {
          // The walk can be cut short when branches leave the viewport. If that
          // leaves the drawing far short of its minimum, seed a fresh origin
          // rather than showing an almost empty background.
          const underfilled = initialBudget - budget < minSegments;
          if (underfilled && reseeds < 24) {
            reseeds += 1;
            steps = seedFromEdges();
          }
          if (!steps.length) {
            rafId.current = null;
            return;
          }
        } else {
          prevSteps.forEach((i) => {
            // 50% chance to defer a step — the source of the organic uneven growth.
            if (Math.random() < 0.5) steps.push(i);
            else i();
          });
        }
      }

      rafId.current = requestAnimationFrame(frame);
    };

    rafId.current = requestAnimationFrame(frame);
  }, [resolvedTheme]);

  useEffect(() => {
    startGrowth();

    const handleResize = () => startGrowth();

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    };
  }, [startGrowth]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 -z-10 h-full w-full ${className}`}
      style={{
        // antfu's mask pulls the art to the frame edges and keeps the reading
        // column clear. Center stays fully transparent, edges fully opaque.
        maskImage: "radial-gradient(circle at 50% 50%, transparent 8%, black 72%)",
        WebkitMaskImage: "radial-gradient(circle at 50% 50%, transparent 8%, black 72%)",
      }}
    />
  );
}

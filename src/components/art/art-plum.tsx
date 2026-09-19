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
/**
 * Blossom budget. Reverted to 50% visual balance per user request (54 desktop / 28 mobile),
 * with blossoms strictly distributed onto distal twig ends (梢头挂梅) and 0% at the root.
 */
const MAX_BLOSSOMS_DESKTOP = 54;
const MAX_BLOSSOMS_MOBILE = 28;
/**
 * Minimum spacing between two blossoms, in px.
 */
const BLOSSOM_MIN_DIST = 26;

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
 * On top of the bare branches this adds sparse theme-pink plum blossoms, capped
 * globally and spaced apart, so they read as individual flowers on a winter twig
 * rather than a dense floral mass.
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

    const petalColor = isDark
      ? "rgba(247, 92, 126, 0.85)"
      : "rgba(226, 62, 94, 0.80)";

    const petalHalo = isDark
      ? "rgba(247, 92, 126, 0.16)"
      : "rgba(247, 92, 126, 0.12)";

    const pistilColor = isDark
      ? "rgba(255, 246, 249, 0.92)"
      : "rgba(255, 255, 255, 0.95)";

    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = 1;
    ctx.strokeStyle = branchColor;

    const maxBlossoms = width < 640 ? MAX_BLOSSOMS_MOBILE : MAX_BLOSSOMS_DESKTOP;
    const placed: { x: number; y: number }[] = [];

    // Area-scaled so a phone and a 4K screen get the same visual weight.
    const areaScale = (width * height) / REF_AREA;
    let budget = Math.max(1_500, Math.round(SEGMENT_BUDGET_REF * areaScale));
    const initialBudget = budget;
    const minSegments = Math.max(700, Math.round(MIN_SEGMENTS_REF * areaScale));

    function canPlace(x: number, y: number): boolean {
      if (placed.length >= maxBlossoms) return false;
      // Dynamic lifecycle pacing: evenly distributes blossoms across the entire
      // growth timeframe and reach of the tree, preventing early branch tips from
      // greedily exhausting the quota into an artificial concentric cluster.
      const progress = Math.min(1, Math.max(0, 1 - budget / initialBudget));
      const maxAllowedNow = Math.ceil(maxBlossoms * Math.min(1, progress * 1.05 + 0.05));
      if (placed.length >= maxAllowedNow) return false;

      for (const p of placed) {
        const dx = x - p.x;
        const dy = y - p.y;
        if (dx * dx + dy * dy < BLOSSOM_MIN_DIST * BLOSSOM_MIN_DIST) return false;
      }
      return true;
    }

    /** A five-petal plum blossom, drawn at ~4–5px across. */
    function drawBlossom(x: number, y: number, toward: number) {
      ctx!.save();
      const size = 1.55 + Math.random() * 0.35;
      const offset = toward + Math.random() * 0.5;

      // Soft halo so the pink reads against a near-black canvas
      ctx!.beginPath();
      ctx!.arc(x, y, size * 2.5, 0, Math.PI * 2);
      ctx!.fillStyle = petalHalo;
      ctx!.fill();

      for (let i = 0; i < 5; i++) {
        const a = offset + (i * Math.PI * 2) / 5;
        ctx!.beginPath();
        ctx!.arc(
          x + Math.cos(a) * size * 0.78,
          y + Math.sin(a) * size * 0.78,
          size * 0.55,
          0,
          Math.PI * 2
        );
        ctx!.fillStyle = petalColor;
        ctx!.fill();
      }

      ctx!.beginPath();
      ctx!.arc(x, y, size * 0.34, 0, Math.PI * 2);
      ctx!.fillStyle = pistilColor;
      ctx!.fill();
      ctx!.restore();
    }

    /** A tight winter bud — a solitary crimson droplet with a frost speck. */
    function drawBud(x: number, y: number) {
      ctx!.save();
      const r = 1.05 + Math.random() * 0.35;

      ctx!.beginPath();
      ctx!.arc(x, y, r * 2.2, 0, Math.PI * 2);
      ctx!.fillStyle = petalHalo;
      ctx!.fill();

      ctx!.beginPath();
      ctx!.arc(x, y, r, 0, Math.PI * 2);
      ctx!.fillStyle = petalColor;
      ctx!.fill();

      ctx!.beginPath();
      ctx!.arc(x - r * 0.3, y - r * 0.3, r * 0.36, 0, Math.PI * 2);
      ctx!.fillStyle = pistilColor;
      ctx!.fill();
      ctx!.restore();
    }

    function tryBlossom(x: number, y: number, toward: number, bloomChance: number) {
      if (!canPlace(x, y)) return;
      placed.push({ x, y });
      if (Math.random() < bloomChance) drawBlossom(x, y, toward);
      else drawBud(x, y);
    }

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
      counter: StepCounter = { value: 0 },
      originDist: number = 0
    ) {
      if (!ctx) return;
      counter.value += 1;
      budget -= 1;

      const length = Math.random() * SEGMENT_LEN;
      const [nx, ny] = polar2cart(x, y, length, rad);
      const nextOriginDist = originDist + length;

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

      let children = 0;
      if (Math.random() < rate) {
        steps.push(() => step(nx, ny, rad1, counter, nextOriginDist));
        children++;
      }
      if (Math.random() < rate) {
        steps.push(() => step(nx, ny, rad2, counter, nextOriginDist));
        children++;
      }

      // Organic random scattering (随机漫布 · 疏影横斜):
      // 1. Avoid placing blossoms right on the screen border origins (nextOriginDist >= 85)
      // 2. Uniformly sprinkle blooms across all branch depths, from inner twigs to distant canopy
      if (nextOriginDist >= 85) {
        if (children === 0) {
          // Terminal twig tips across the whole branch system
          if (Math.random() < 0.15) {
            tryBlossom(nx, ny, rad, 0.72);
          }
        } else if (Math.random() < 0.008) {
          // Delicate side buds along mature twigs
          const side = rad + (Math.random() < 0.5 ? 1 : -1) * (Math.PI / 3);
          const [bx, by] = polar2cart(nx, ny, 3 + Math.random() * 3, side);
          if (inBounds(bx, by)) tryBlossom(bx, by, rad, 0.45);
        }
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

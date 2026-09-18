"use client";

import React, { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

interface ArtDotsProps {
  className?: string;
}

interface DotPoint {
  x: number;
  y: number;
  rx: number;
  ry: number;
  currX: number;
  currY: number;
  alpha: number;
}

// Lightweight self-contained 3D Simplex Noise (Zero external dependencies)
const F3 = 1.0 / 3.0;
const G3 = 1.0 / 6.0;

const pTable = new Uint8Array(256);
for (let i = 0; i < 256; i++) {
  pTable[i] = Math.floor(Math.random() * 256);
}

const perm = new Uint8Array(512);
const permMod12 = new Uint8Array(512);
for (let i = 0; i < 512; i++) {
  perm[i] = pTable[i & 255];
  permMod12[i] = perm[i] % 12;
}

const grad3 = new Float32Array([
  1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0,
  1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, -1,
  0, 1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1,
]);

function simplex3D(xin: number, yin: number, zin: number): number {
  let n0: number, n1: number, n2: number, n3: number;
  const s = (xin + yin + zin) * F3;
  const i = Math.floor(xin + s);
  const j = Math.floor(yin + s);
  const k = Math.floor(zin + s);
  const t = (i + j + k) * G3;
  const X0 = i - t;
  const Y0 = j - t;
  const Z0 = k - t;
  const x0 = xin - X0;
  const y0 = yin - Y0;
  const z0 = zin - Z0;

  let i1: number, j1: number, k1: number;
  let i2: number, j2: number, k2: number;
  if (x0 >= y0) {
    if (y0 >= z0) {
      i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0;
    } else if (x0 >= z0) {
      i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1;
    } else {
      i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1;
    }
  } else {
    if (y0 < z0) {
      i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1;
    } else if (x0 < z0) {
      i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1;
    } else {
      i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0;
    }
  }

  const x1 = x0 - i1 + G3;
  const y1 = y0 - j1 + G3;
  const z1 = z0 - k1 + G3;
  const x2 = x0 - i2 + 2.0 * G3;
  const y2 = y0 - j2 + 2.0 * G3;
  const z2 = z0 - k2 + 2.0 * G3;
  const x3 = x0 - 1.0 + 3.0 * G3;
  const y3 = y0 - 1.0 + 3.0 * G3;
  const z3 = z0 - 1.0 + 3.0 * G3;

  const ii = i & 255;
  const jj = j & 255;
  const kk = k & 255;
  const gi0 = permMod12[ii + perm[jj + perm[kk]]] * 3;
  const gi1 = permMod12[ii + i1 + perm[jj + j1 + perm[kk + k1]]] * 3;
  const gi2 = permMod12[ii + i2 + perm[jj + j2 + perm[kk + k2]]] * 3;
  const gi3 = permMod12[ii + 1 + perm[jj + 1 + perm[kk + 1]]] * 3;

  let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
  if (t0 < 0) n0 = 0.0;
  else {
    t0 *= t0;
    n0 = t0 * t0 * (grad3[gi0] * x0 + grad3[gi0 + 1] * y0 + grad3[gi0 + 2] * z0);
  }

  let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
  if (t1 < 0) n1 = 0.0;
  else {
    t1 *= t1;
    n1 = t1 * t1 * (grad3[gi1] * x1 + grad3[gi1 + 1] * y1 + grad3[gi1 + 2] * z1);
  }

  let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
  if (t2 < 0) n2 = 0.0;
  else {
    t2 *= t2;
    n2 = t2 * t2 * (grad3[gi2] * x2 + grad3[gi2 + 1] * y2 + grad3[gi2 + 2] * z2);
  }

  let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
  if (t3 < 0) n3 = 0.0;
  else {
    t3 *= t3;
    n3 = t3 * t3 * (grad3[gi3] * x3 + grad3[gi3 + 1] * y3 + grad3[gi3 + 2] * z3);
  }

  return 32.0 * (n0 + n1 + n2 + n3);
}

const SCALE = 220;
const LENGTH = 5;
const SPACING = 16;
const REPEL_RADIUS = 110;
const REPEL_RADIUS_SQ = REPEL_RADIUS * REPEL_RADIUS;

export function ArtDots({ className = "" }: ArtDotsProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;

    const isDark =
      resolvedTheme === "dark" ||
      document.documentElement.classList.contains("dark");

    const dotR = isDark ? 220 : 90;
    const dotG = isDark ? 220 : 90;
    const dotB = isDark ? 220 : 90;
    const alphaFactor = isDark ? 0.48 : 0.36;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let points: DotPoint[] = [];

    // Static wave snapshot: calculated once so the background has an organic topology
    // without continuous CPU/GPU timer loops consuming thread bandwidth.
    const initPoints = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      points = [];
      const staticT = 1.2;

      for (let x = -SPACING / 2; x < width + SPACING; x += SPACING) {
        for (let y = -SPACING / 2; y < height + SPACING; y += SPACING) {
          const baseOpacity = Math.random() * 0.4 + 0.35;
          const rad = (simplex3D(x / SCALE, y / SCALE, staticT) - 0.5) * 2 * Math.PI;
          const len = (simplex3D(x / SCALE, y / SCALE, staticT * 1.2) + 0.5) * LENGTH;

          const rx = x + Math.cos(rad) * len;
          const ry = y + Math.sin(rad) * len;
          const alpha =
            (Math.abs(Math.cos(rad)) * 0.75 + 0.25) * baseOpacity * alphaFactor;

          points.push({
            x,
            y,
            rx,
            ry,
            currX: rx,
            currY: ry,
            alpha,
          });
        }
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        ctx.beginPath();
        ctx.arc(p.currX, p.currY, 1.1, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${dotR}, ${dotG}, ${dotB}, ${p.alpha})`;
        ctx.fill();
      }
    };

    initPoints();
    draw(); // Initial static render: zero ongoing CPU usage while idle

    // Interactive mouse repulsion (only runs when pointer is actively moving)
    let mouseX = -9999;
    let mouseY = -9999;
    let animId: number | null = null;
    let isMoving = false;
    let moveTimeout: ReturnType<typeof setTimeout> | null = null;

    const tick = () => {
      let active = false;

      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        let targetX = p.rx;
        let targetY = p.ry;

        const dx = p.rx - mouseX;
        const dy = p.ry - mouseY;
        const distSq = dx * dx + dy * dy;

        if (distSq < REPEL_RADIUS_SQ && distSq > 0.1) {
          const dist = Math.sqrt(distSq);
          const push = (1 - dist / REPEL_RADIUS) * 14;
          targetX = p.rx + (dx / dist) * push;
          targetY = p.ry + (dy / dist) * push;
        }

        const dX = targetX - p.currX;
        const dY = targetY - p.currY;

        if (Math.abs(dX) > 0.08 || Math.abs(dY) > 0.08) {
          p.currX += dX * 0.22;
          p.currY += dY * 0.22;
          active = true;
        } else {
          p.currX = targetX;
          p.currY = targetY;
        }
      }

      draw();

      // Keep running only as long as points are returning to rest or mouse is moving
      if (active || isMoving) {
        animId = requestAnimationFrame(tick);
      } else {
        animId = null;
      }
    };

    const wakeUp = () => {
      if (prefersReducedMotion) return;
      if (animId === null) {
        animId = requestAnimationFrame(tick);
      }
    };

    const handlePointerMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      isMoving = true;
      if (moveTimeout) clearTimeout(moveTimeout);
      moveTimeout = setTimeout(() => {
        isMoving = false;
      }, 100);
      wakeUp();
    };

    const handlePointerLeave = () => {
      mouseX = -9999;
      mouseY = -9999;
      isMoving = false;
      wakeUp();
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerleave", handlePointerLeave, { passive: true });

    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const handleResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        initPoints();
        draw();
      }, 250);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      if (animId !== null) cancelAnimationFrame(animId);
      if (resizeTimer) clearTimeout(resizeTimer);
      if (moveTimeout) clearTimeout(moveTimeout);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, [resolvedTheme]);

  return (
    <div
      className={`fixed inset-0 pointer-events-none print:hidden ${className}`}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="h-full w-full block" />
    </div>
  );
}

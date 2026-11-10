import fs from "node:fs";
import path from "node:path";

/**
 * Post-build fixups for the React Router / Vite static export.
 *
 * 1. Cloudflare Workers Static Assets serves `404.html` when
 *    `not_found_handling` is `"404-page"`. React Router's prerender emits the
 *    `src/router/routes/not-found.tsx` route at `build/client/404/index.html`,
 *    so copy it to the location Cloudflare expects.
 * 2. React Router also emits `__spa-fallback.html` for `ssr: false`. Every
 *    route here is prerendered, and unknown URLs are handled by `404.html`,
 *    so the fallback shell is dead output (and would fail an SEO audit as an
 *    indexable page with no metadata).
 */
const clientDir = path.resolve(process.cwd(), "build/client");
const source = path.join(clientDir, "404", "index.html");
const target = path.join(clientDir, "404.html");
const spaFallback = path.join(clientDir, "__spa-fallback.html");

if (!fs.existsSync(source)) {
  console.warn("[vite-build] build/client/404/index.html not found; skipping 404.html copy.");
} else {
  fs.copyFileSync(source, target);
  console.log("[vite-build] Copied 404/index.html to 404.html.");
}

if (fs.existsSync(spaFallback)) {
  fs.rmSync(spaFallback);
  console.log("[vite-build] Removed unused __spa-fallback.html.");
}

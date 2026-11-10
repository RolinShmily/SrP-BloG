import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

/**
 * Static output to index. The Next.js build writes `out/`; the Vite /
 * React Router build writes `build/client/`. Callers pass the directory:
 *
 *   tsx scripts/build-pagefind.ts            # Next.js default: out/
 *   tsx scripts/build-pagefind.ts build/client
 */
const siteArg = process.argv[2] ?? "out";
const siteDir = path.isAbsolute(siteArg) ? siteArg : path.join(rootDir, siteArg);
const siteRelative = path.relative(rootDir, siteDir);
const publicPagefind = path.join(rootDir, "public/pagefind");

export function runPagefind() {
  if (!fs.existsSync(siteDir)) {
    console.warn(`[pagefind] ${siteRelative}/ does not exist. Skipping pagefind indexing.`);
    return;
  }

  console.log(`[pagefind] Running pagefind on ${siteRelative}/...`);
  execFileSync("pnpm", ["exec", "pagefind", "--site", siteRelative], {
    cwd: rootDir,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  const sitePagefind = path.join(siteDir, "pagefind");
  if (fs.existsSync(sitePagefind)) {
    // Replace instead of merge so a deleted/renamed index fragment cannot
    // linger in the dev copy.
    fs.rmSync(publicPagefind, { recursive: true, force: true });
    fs.cpSync(sitePagefind, publicPagefind, { recursive: true });
    console.log(
      `[pagefind] Copied search bundle to ${path.relative(rootDir, publicPagefind)}/ for local dev support.`
    );
  }
}

if (process.argv[1] === __filename) {
  runPagefind();
}

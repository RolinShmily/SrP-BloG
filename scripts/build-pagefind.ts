import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const outDir = path.join(rootDir, "out");
const publicPagefind = path.join(rootDir, "public/pagefind");

export function runPagefind() {
  if (!fs.existsSync(outDir)) {
    console.warn("[pagefind] out/ directory does not exist. Skipping pagefind indexing.");
    return;
  }

  console.log("[pagefind] Running pagefind on out/...");
  execFileSync("pnpm", ["exec", "pagefind", "--site", "out"], {
    cwd: rootDir,
    stdio: "inherit",
  });

  const outPagefind = path.join(outDir, "pagefind");
  if (fs.existsSync(outPagefind)) {
    fs.cpSync(outPagefind, publicPagefind, { recursive: true });
    console.log(`[pagefind] Copied search bundle to ${publicPagefind} for local dev support.`);
  }
}

if (process.argv[1] === __filename) {
  runPagefind();
}

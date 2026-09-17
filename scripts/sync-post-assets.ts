/**
 * Prebuild step: copies post-local assets (`content/posts/<slug>/*` non-markdown
 * files, e.g. `cover.jpeg`, screenshots) into `public/posts/<slug>/` so that
 * markdown references like `./cover.jpeg` resolve to `/posts/<slug>/cover.jpeg`
 * in the static export.
 *
 * The script is idempotent: files whose size and mtime are unchanged are skipped,
 * and rerunning it never fails on existing targets. CJK/space/special characters
 * in file or directory names are preserved verbatim.
 *
 * Wired into `pnpm dev` / `pnpm build` — see package.json.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const rootDir = path.resolve(__dirname, "..");
export const postsDir = path.join(rootDir, "content/posts");
export const publicPostsDir = path.join(rootDir, "public/posts");

const MARKDOWN_PATTERN = /\.mdx?$/i;

export interface PostAssetSyncOptions {
  /** Source directory, defaults to `content/posts`. */
  source?: string;
  /** Destination directory, defaults to `public/posts`. */
  destination?: string;
}

export interface PostAssetSyncResult {
  /** Number of directories inspected under the source root. */
  scannedDirs: number;
  /** Assets (relative to the destination root) written this run. */
  copied: string[];
  /** Assets (relative to the destination root) that were already up to date. */
  skipped: string[];
  /**
   * Destination directories (relative to the destination root) removed because
   * their source directory no longer exists.
   */
  pruned: string[];
}

/**
 * Lists every directory under `root`, as paths relative to `root`, using the
 * platform separator. The root itself is included as an empty string.
 */
function listRelativeDirs(root: string): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    out.push(path.relative(root, dir));
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) walk(path.join(dir, entry.name));
    }
  };
  walk(root);
  return out;
}

/**
 * Removes destination directories whose source counterpart has disappeared.
 *
 * Without this, renaming or deleting a post leaves its old `public/posts/<slug>/`
 * directory behind forever — the build chain has no clean step, and that
 * directory is copied verbatim into the static export. Pruning is deliberately
 * scoped to directories that are absent from the source: anything still present
 * is left to the size/mtime check below.
 */
function pruneOrphanDirs(source: string, destination: string, result: PostAssetSyncResult): void {
  if (!fs.existsSync(destination)) return;

  const sourceDirs = new Set(listRelativeDirs(source));
  const destinationDirs = listRelativeDirs(destination)
    // Deepest first, so removing a parent never skips a stale child.
    .sort((a, b) => b.length - a.length);

  for (const relative of destinationDirs) {
    if (relative === "" || sourceDirs.has(relative)) continue;
    const target = path.join(destination, relative);
    fs.rmSync(target, { recursive: true, force: true });
    result.pruned.push(relative);
  }
}

/**
 * Copies post-local (co-located) assets into the public directory.
 */
export function syncPostAssets(options: PostAssetSyncOptions = {}): PostAssetSyncResult {
  const source = options.source ?? postsDir;
  const destination = options.destination ?? publicPostsDir;
  const result: PostAssetSyncResult = { scannedDirs: 0, copied: [], skipped: [], pruned: [] };

  if (!fs.existsSync(source)) {
    console.warn(`[sync-post-assets] Source directory not found, skipping: ${source}`);
    return result;
  }

  const walk = (dir: string): void => {
    result.scannedDirs += 1;

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }
      if (!entry.isFile()) continue;
      // Hidden files (.DS_Store, …) and markdown sources are not assets.
      if (entry.name.startsWith(".")) continue;
      if (MARKDOWN_PATTERN.test(entry.name)) continue;

      const relativeDir = path.relative(source, dir);
      const relativeKey = relativeDir ? path.join(relativeDir, entry.name) : entry.name;
      const targetDir = path.join(destination, relativeDir);
      const target = path.join(targetDir, entry.name);

      if (fs.existsSync(target)) {
        const sourceStat = fs.statSync(fullPath);
        const targetStat = fs.statSync(target);
        if (targetStat.size === sourceStat.size && targetStat.mtimeMs >= sourceStat.mtimeMs) {
          result.skipped.push(relativeKey);
          continue;
        }
      }

      fs.mkdirSync(targetDir, { recursive: true });
      fs.copyFileSync(fullPath, target);
      result.copied.push(relativeKey);
    }
  };

  walk(source);
  pruneOrphanDirs(source, destination, result);
  return result;
}

function main(): void {
  const result = syncPostAssets();
  console.log(
    `[sync-post-assets] Scanned ${result.scannedDirs} directories: ` +
      `${result.copied.length} copied, ${result.skipped.length} already up to date, ` +
      `${result.pruned.length} orphaned removed.`
  );
  for (const file of result.copied) {
    console.log(`[sync-post-assets]   + public/posts/${file}`);
  }
  for (const dir of result.pruned) {
    console.log(`[sync-post-assets]   - public/posts/${dir} (no source directory)`);
  }
}

if (process.argv[1] === __filename) {
  try {
    main();
  } catch (error) {
    console.error("[sync-post-assets] Failed to sync post assets:", error);
    process.exit(1);
  }
}

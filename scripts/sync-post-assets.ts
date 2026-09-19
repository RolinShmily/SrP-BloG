/**
 * Prebuild step: copies post-local assets (`content/posts/<slug>/*` non-markdown
 * files, e.g. `cover.jpeg`, screenshots) into `public/posts/<slug>/` so that
 * markdown references like `./cover.jpeg` resolve to `/posts/<slug>/cover.jpeg`
 * in the static export.
 *
 * For images (.png, .jpg, .jpeg, .webp), generates an incremental, idempotent
 * WebP thumbnail (<basename>.thumb.webp) alongside the original file using sharp.
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
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const rootDir = path.resolve(__dirname, "..");
export const postsDir = path.join(rootDir, "content/posts");
export const publicPostsDir = path.join(rootDir, "public/posts");

const MARKDOWN_PATTERN = /\.mdx?$/i;
const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);

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
  /** Thumbnail files (relative to the destination root) written this run. */
  thumbnailsGenerated: string[];
  /** Thumbnail files (relative to the destination root) that were already up to date. */
  thumbnailsSkipped: string[];
  /** Orphan thumbnail files (relative to the destination root) removed. */
  prunedThumbs: string[];
}

interface ThumbnailTask {
  sourcePath: string;
  targetPath: string;
  relativeKey: string;
}

function isImageFile(fileName: string): boolean {
  if (fileName.endsWith(".thumb.webp")) return false;
  const ext = path.extname(fileName).toLowerCase();
  return IMAGE_EXTENSIONS.has(ext);
}

function getThumbnailName(fileName: string): string {
  const { name } = path.parse(fileName);
  return `${name}.thumb.webp`;
}

async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<void>
): Promise<void> {
  if (items.length === 0) return;
  let index = 0;
  const workerCount = Math.min(limit, items.length);
  const workers = Array.from({ length: workerCount }, async () => {
    while (index < items.length) {
      const current = items[index++];
      await fn(current);
    }
  });
  await Promise.all(workers);
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
 * Removes `.thumb.webp` files in destination if their corresponding source image
 * in `content/posts/` has been deleted or renamed.
 */
function pruneOrphanThumbnails(
  destination: string,
  expectedThumbs: Set<string>,
  result: PostAssetSyncResult
): void {
  if (!fs.existsSync(destination)) return;

  const walk = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".thumb.webp")) {
        const relativeKey = path.relative(destination, fullPath);
        if (!expectedThumbs.has(relativeKey)) {
          fs.rmSync(fullPath, { force: true });
          result.prunedThumbs.push(relativeKey);
        }
      }
    }
  };

  walk(destination);
}

/**
 * Copies post-local (co-located) assets into the public directory and generates
 * optimized WebP thumbnails alongside any source images.
 */
export async function syncPostAssets(
  options: PostAssetSyncOptions = {}
): Promise<PostAssetSyncResult> {
  const source = options.source ?? postsDir;
  const destination = options.destination ?? publicPostsDir;
  const result: PostAssetSyncResult = {
    scannedDirs: 0,
    copied: [],
    skipped: [],
    pruned: [],
    thumbnailsGenerated: [],
    thumbnailsSkipped: [],
    prunedThumbs: [],
  };

  if (!fs.existsSync(source)) {
    console.warn(`[sync-post-assets] Source directory not found, skipping: ${source}`);
    return result;
  }

  const expectedThumbs = new Set<string>();
  const thumbTasks: ThumbnailTask[] = [];

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

      const sourceStat = fs.statSync(fullPath);
      let shouldCopy = true;

      if (fs.existsSync(target)) {
        const targetStat = fs.statSync(target);
        if (targetStat.size === sourceStat.size && targetStat.mtimeMs >= sourceStat.mtimeMs) {
          shouldCopy = false;
        }
      }

      if (shouldCopy) {
        fs.mkdirSync(targetDir, { recursive: true });
        fs.copyFileSync(fullPath, target);
        result.copied.push(relativeKey);
      } else {
        result.skipped.push(relativeKey);
      }

      // Thumbnail generation for images
      if (isImageFile(entry.name)) {
        const thumbName = getThumbnailName(entry.name);
        const thumbTarget = path.join(targetDir, thumbName);
        const thumbRelativeKey = relativeDir ? path.join(relativeDir, thumbName) : thumbName;

        expectedThumbs.add(thumbRelativeKey);

        let shouldGenerateThumb = true;
        if (fs.existsSync(thumbTarget)) {
          const thumbStat = fs.statSync(thumbTarget);
          if (thumbStat.size > 0 && thumbStat.mtimeMs >= sourceStat.mtimeMs) {
            shouldGenerateThumb = false;
            result.thumbnailsSkipped.push(thumbRelativeKey);
          }
        }

        if (shouldGenerateThumb) {
          thumbTasks.push({
            sourcePath: fullPath,
            targetPath: thumbTarget,
            relativeKey: thumbRelativeKey,
          });
        }
      }
    }
  };

  walk(source);

  // Generate missing or outdated thumbnails
  await runWithConcurrency(thumbTasks, 8, async (task) => {
    fs.mkdirSync(path.dirname(task.targetPath), { recursive: true });
    await sharp(task.sourcePath)
      .rotate()
      .resize({
        width: 768,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 82 })
      .toFile(task.targetPath);
    result.thumbnailsGenerated.push(task.relativeKey);
  });

  pruneOrphanDirs(source, destination, result);
  pruneOrphanThumbnails(destination, expectedThumbs, result);
  return result;
}

async function main(): Promise<void> {
  const result = await syncPostAssets();
  console.log(
    `[sync-post-assets] Scanned ${result.scannedDirs} directories: ` +
      `${result.copied.length} copied, ${result.skipped.length} already up to date, ` +
      `${result.pruned.length} orphaned removed.`
  );
  if (result.thumbnailsGenerated.length > 0 || result.thumbnailsSkipped.length > 0) {
    console.log(
      `[sync-post-assets] Thumbnails: ${result.thumbnailsGenerated.length} generated, ` +
        `${result.thumbnailsSkipped.length} already up to date, ` +
        `${result.prunedThumbs.length} orphaned removed.`
    );
  }
  for (const file of result.copied) {
    console.log(`[sync-post-assets]   + public/posts/${file}`);
  }
  for (const dir of result.pruned) {
    console.log(`[sync-post-assets]   - public/posts/${dir} (no source directory)`);
  }
  for (const thumb of result.prunedThumbs) {
    console.log(`[sync-post-assets]   - public/posts/${thumb} (orphan thumbnail)`);
  }
}

if (process.argv[1] === __filename) {
  main().catch((error) => {
    console.error("[sync-post-assets] Failed to sync post assets:", error);
    process.exit(1);
  });
}

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type {
  ContentQueryArg,
  IContentProvider,
  Post,
  PostDetail,
  PostQueryOptions,
  SearchIndexItem,
  SiteStats,
  TagInfo,
  TocItem,
} from "./types";
import {
  calculateReadingTime,
  countWords,
  renderMarkdownToHtml,
  resolveImagePath,
  stripMarkdown,
} from "./markdown";
import { siteConfig } from "@/config/site";

/** Frontmatter-derived metadata for a post. */
interface PostMeta {
  title: string;
  published: string;
  updated?: string;
  draft: boolean;
  description?: string;
  image?: string;
  thumbnail?: string;
  tags: string[];
  lang?: string;
  pinned: boolean;
  wordCount: number;
  readingTime: string;
  excerpt: string;
}

/** A single post parsed from disk. */
interface RawPostData {
  slug: string;
  filePath: string;
  rawContent: string;
  plainText: string;
  meta: PostMeta;
}

/** Matches the standard post entry file: `index.md` or `index.mdx`. */
const POST_FILE_PATTERN = /^index\.(?:md|mdx)$/;
const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);

/**
 * Derives the sibling `.thumb.webp` path for a post cover.
 *
 * Returns `undefined` when `siteConfig.cardThumbnail` is off: the build then
 * never emits a thumbnail, so advertising one would make every card a 404.
 */
function resolveThumbnailPath(imagePath?: string): string | undefined {
  if (siteConfig.cardThumbnail === false) return undefined;
  if (!imagePath || !imagePath.startsWith("/posts/")) return undefined;
  if (imagePath.endsWith(".thumb.webp")) return imagePath;

  const ext = path.posix.extname(imagePath).toLowerCase();
  if (!IMAGE_EXTENSIONS.has(ext)) return undefined;

  const parsed = path.posix.parse(imagePath);
  return path.posix.join(parsed.dir, `${parsed.name}.thumb.webp`);
}

function formatDate(value: unknown): string {
  if (!value) return "";
  if (value instanceof Date) {
    const y = value.getUTCFullYear();
    const m = String(value.getUTCMonth() + 1).padStart(2, "0");
    const d = String(value.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const str = String(value).trim();
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getUTCFullYear();
    const m = String(parsed.getUTCMonth() + 1).padStart(2, "0");
    const d = String(parsed.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return str;
}

export class LocalContentProvider implements IContentProvider {
  private readonly postsDir: string;
  private cache: Map<string, RawPostData> | null = null;

  constructor(postsDir?: string) {
    this.postsDir = postsDir || path.join(process.cwd(), "content/posts");
  }

  /**
   * Clears in-memory cache to force re-reading from disk.
   */
  public invalidateCache(): void {
    this.cache = null;
  }

  /**
   * Recursively finds every co-located post file (`<slug>/index.md`).
   * The slug is derived from the containing directory name, so slugs containing
   * CJK characters or other special characters are preserved verbatim.
   */
  private scanPostFiles(): Array<{ slug: string; filePath: string }> {
    if (!fs.existsSync(this.postsDir)) return [];

    const results: Array<{ slug: string; filePath: string }> = [];

    const walk = (dir: string): void => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(fullPath);
          continue;
        }
        if (!entry.isFile()) continue;

        if (!POST_FILE_PATTERN.test(entry.name)) continue;

        const slug = path.relative(this.postsDir, dir).split(path.sep).join("/");
        if (!slug) continue;

        results.push({ slug, filePath: fullPath });
      }
    };

    walk(this.postsDir);
    return results;
  }

  /**
   * Parses a single `index.md` file into metadata + plain text.
   */
  private parsePostFile(filePath: string, slug: string): RawPostData {
    const fileContent = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(fileContent);

    const plainText = stripMarkdown(content);
    const wordCount = countWords(plainText);
    const readingTime = calculateReadingTime(wordCount);
    const title = data.title ? String(data.title).trim() : slug;
    const description = data.description ? String(data.description).trim() : undefined;

    const image = resolveImagePath(typeof data.image === "string" ? data.image : undefined, slug);
    const thumbnail = resolveThumbnailPath(image);

    const meta: PostMeta = {
      title,
      published: formatDate(data.published),
      updated: data.updated ? formatDate(data.updated) : undefined,
      draft: Boolean(data.draft),
      description,
      image,
      thumbnail,
      tags: Array.isArray(data.tags)
        ? data.tags.map((tag) => String(tag).trim()).filter(Boolean)
        : [],
      lang: data.lang ? String(data.lang).trim() : undefined,
      pinned: Boolean(data.pinned),
      wordCount,
      readingTime,
      excerpt: description
        ? description
        : plainText.length > 160
          ? `${plainText.slice(0, 160).trim()}...`
          : plainText.trim(),
    };

    return { slug, filePath, rawContent: content, plainText, meta };
  }

  /**
   * Loads, parses and groups every post file by slug.
   */
  private loadRawPosts(): Map<string, RawPostData> {
    if (this.cache) return this.cache;

    const postMap = new Map<string, RawPostData>();

    for (const { slug, filePath } of this.scanPostFiles()) {
      const parsed = this.parsePostFile(filePath, slug);
      postMap.set(slug, parsed);
    }

    this.cache = postMap;
    return postMap;
  }

  /**
   * Resolves options when either `(options)` or `(locale, options)` is called.
   */
  private resolveOptions(arg?: ContentQueryArg, options?: PostQueryOptions): PostQueryOptions {
    if (typeof arg === "object" && arg !== null) {
      return arg;
    }
    return options ?? {};
  }

  /**
   * Builds the public `Post` shape from raw post data.
   */
  private materialize(raw: RawPostData): Post {
    return {
      slug: raw.slug,
      ...raw.meta,
    };
  }

  /**
   * Sorts posts: pinned posts first, then descending by published date.
   */
  private sortPosts(posts: Post[]): Post[] {
    return [...posts].sort((a, b) => {
      if (a.pinned !== b.pinned) {
        return a.pinned ? -1 : 1;
      }
      const timeA = new Date(a.published).getTime() || 0;
      const timeB = new Date(b.published).getTime() || 0;
      if (timeA !== timeB) {
        return timeB - timeA;
      }
      return a.title.localeCompare(b.title, "zh-CN");
    });
  }

  /**
   * Finds a raw post by slug. Accepts canonical directory slug and handles
   * percent-encoded (CJK) slugs.
   */
  private findRawPost(map: Map<string, RawPostData>, slug: string): RawPostData | undefined {
    let decoded = slug;
    try {
      decoded = decodeURIComponent(slug);
    } catch {
      /* Malformed percent-encoding: fall back to the raw value. */
    }
    const normalized = decoded.replace(/^\/+|\/+$/g, "");
    const candidates = [normalized];
    if (normalized.endsWith("/index")) {
      candidates.push(normalized.slice(0, -"/index".length));
    } else {
      candidates.push(`${normalized}/index`);
    }
    for (const candidate of candidates) {
      const hit = map.get(candidate);
      if (hit) return hit;
    }
    return undefined;
  }

  /**
   * Returns all posts, sorted with drafts filtered unless `includeDrafts` is true.
   */
  public async getAllPosts(
    localeOrOptions?: ContentQueryArg,
    maybeOptions?: PostQueryOptions
  ): Promise<Post[]> {
    const options = this.resolveOptions(localeOrOptions, maybeOptions);
    const rawMap = this.loadRawPosts();
    const posts: Post[] = [];

    for (const raw of rawMap.values()) {
      if (raw.meta.draft && !options.includeDrafts) continue;
      posts.push(this.materialize(raw));
    }

    return this.sortPosts(posts);
  }

  /**
   * Returns full post details for the given slug.
   */
  public async getPostBySlug(
    slug: string,
    localeOrOptions?: ContentQueryArg,
    maybeOptions?: PostQueryOptions
  ): Promise<PostDetail | null> {
    const options = this.resolveOptions(localeOrOptions, maybeOptions);
    const rawMap = this.loadRawPosts();
    const raw = this.findRawPost(rawMap, slug);
    if (!raw) return null;

    if (raw.meta.draft && !options.includeDrafts) return null;

    const rendered = await renderMarkdownToHtml(raw.rawContent, raw.slug);

    const sortedPosts = await this.getAllPosts(options);
    const currentIndex = sortedPosts.findIndex((post) => post.slug === raw.slug);

    // In a descending list (newest first):
    // index - 1 is newer (nextPost)
    // index + 1 is older (prevPost)
    const nextPost =
      currentIndex > 0
        ? { slug: sortedPosts[currentIndex - 1].slug, title: sortedPosts[currentIndex - 1].title }
        : undefined;

    const prevPost =
      currentIndex >= 0 && currentIndex < sortedPosts.length - 1
        ? { slug: sortedPosts[currentIndex + 1].slug, title: sortedPosts[currentIndex + 1].title }
        : undefined;

    const toc: TocItem[] = rendered.toc;

    return {
      ...this.materialize(raw),
      contentHtml: rendered.contentHtml,
      toc,
      prevPost,
      nextPost,
    };
  }

  /**
   * Aggregates all tags with post counts, sorted descending by post count.
   */
  public async getAllTags(
    localeOrOptions?: ContentQueryArg,
    maybeOptions?: PostQueryOptions
  ): Promise<TagInfo[]> {
    const options = this.resolveOptions(localeOrOptions, maybeOptions);
    const posts = await this.getAllPosts(options);
    const countMap: Record<string, number> = {};

    for (const post of posts) {
      for (const tag of post.tags) {
        countMap[tag] = (countMap[tag] || 0) + 1;
      }
    }

    return Object.entries(countMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => {
        const diff = b.count - a.count;
        if (diff !== 0) return diff;
        return a.name.localeCompare(b.name, "zh-CN");
      });
  }

  /**
   * Returns total post count and total word count.
   */
  public async getSiteStats(
    localeOrOptions?: ContentQueryArg,
    maybeOptions?: PostQueryOptions
  ): Promise<SiteStats> {
    const options = this.resolveOptions(localeOrOptions, maybeOptions);
    const posts = await this.getAllPosts(options);
    const totalPosts = posts.length;
    const totalWordCount = posts.reduce((sum, post) => sum + post.wordCount, 0);

    return {
      totalPosts,
      totalWordCount,
    };
  }

  /**
   * Returns a lightweight search index payload for client-side search.
   */
  public async getSearchIndex(
    localeOrOptions?: ContentQueryArg,
    maybeOptions?: PostQueryOptions
  ): Promise<SearchIndexItem[]> {
    const options = this.resolveOptions(localeOrOptions, maybeOptions);
    const rawMap = this.loadRawPosts();
    const posts = await this.getAllPosts(options);

    return posts.map((post) => {
      const raw = rawMap.get(post.slug);

      return {
        slug: post.slug,
        title: post.title,
        description: post.description,
        tags: post.tags,
        date: post.published,
        wordCount: post.wordCount,
        plainText: raw ? raw.plainText : "",
      };
    });
  }
}

// Singleton default instance
export const contentProvider = new LocalContentProvider();

// Convenience helper exports (mirroring the IContentProvider signatures)
export const getAllPosts = (
  localeOrOptions?: ContentQueryArg,
  options?: PostQueryOptions
): Promise<Post[]> => contentProvider.getAllPosts(localeOrOptions, options);
export const getPostBySlug = (
  slug: string,
  localeOrOptions?: ContentQueryArg,
  options?: PostQueryOptions
): Promise<PostDetail | null> =>
  contentProvider.getPostBySlug(slug, localeOrOptions, options);
export const getAllTags = (
  localeOrOptions?: ContentQueryArg,
  options?: PostQueryOptions
): Promise<TagInfo[]> => contentProvider.getAllTags(localeOrOptions, options);
export const getSiteStats = (
  localeOrOptions?: ContentQueryArg,
  options?: PostQueryOptions
): Promise<SiteStats> => contentProvider.getSiteStats(localeOrOptions, options);
export const getSearchIndex = (
  localeOrOptions?: ContentQueryArg,
  options?: PostQueryOptions
): Promise<SearchIndexItem[]> => contentProvider.getSearchIndex(localeOrOptions, options);

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { DEFAULT_LOCALE, LOCALES, isLocale } from "../../i18n/types";
import type { Locale } from "../../i18n/types";
import type {
  CategoryInfo,
  ContentQueryArg,
  IContentProvider,
  Post,
  PostDetail,
  PostQueryOptions,
  PostTranslation,
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

/** Frontmatter-derived metadata for one language version of a post. */
interface PostMeta {
  title: string;
  published: string;
  updated?: string;
  draft: boolean;
  description?: string;
  image?: string;
  tags: string[];
  category?: string;
  lang?: string;
  pinned: boolean;
  wordCount: number;
  readingTime: string;
  excerpt: string;
}

/** A single `index.<locale>.md` file parsed from disk. */
interface RawLocaleData {
  locale: Locale;
  filePath: string;
  rawContent: string;
  plainText: string;
  meta: PostMeta;
}

/** All language versions of one post, keyed by slug (the directory name). */
interface RawPostData {
  slug: string;
  locales: Partial<Record<Locale, RawLocaleData>>;
  availableLocales: Locale[];
}

interface ResolvedQuery {
  locale: Locale;
  options: PostQueryOptions;
}

/** Matches the co-located bilingual file naming convention: `index.zh.md` / `index.en.mdx`. */
const POST_FILE_PATTERN = /^index\.(zh|en)\.(?:md|mdx)$/;

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
   * Recursively finds every co-located post file (`<slug>/index.<locale>.md`).
   * The slug is derived from the containing directory name, so slugs containing
   * CJK characters or other special characters are preserved verbatim.
   */
  private scanPostFiles(): Array<{ slug: string; locale: Locale; filePath: string }> {
    if (!fs.existsSync(this.postsDir)) return [];

    const results: Array<{ slug: string; locale: Locale; filePath: string }> = [];

    const walk = (dir: string): void => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(fullPath);
          continue;
        }
        if (!entry.isFile()) continue;

        const match = POST_FILE_PATTERN.exec(entry.name);
        if (!match) continue;

        const slug = path.relative(this.postsDir, dir).split(path.sep).join("/");
        if (!slug) continue;

        results.push({ slug, locale: match[1] as Locale, filePath: fullPath });
      }
    };

    walk(this.postsDir);
    return results;
  }

  /**
   * Parses a single `index.<locale>.md` file into metadata + plain text.
   */
  private parseLocaleFile(filePath: string, locale: Locale, slug: string): RawLocaleData {
    const fileContent = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(fileContent);

    const plainText = stripMarkdown(content);
    const wordCount = countWords(plainText);
    const readingTime = calculateReadingTime(wordCount);
    const title = data.title ? String(data.title).trim() : slug;
    const description = data.description ? String(data.description).trim() : undefined;

    const meta: PostMeta = {
      title,
      published: formatDate(data.published),
      updated: data.updated ? formatDate(data.updated) : undefined,
      draft: Boolean(data.draft),
      description,
      image: resolveImagePath(typeof data.image === "string" ? data.image : undefined, slug),
      tags: Array.isArray(data.tags)
        ? data.tags.map((tag) => String(tag).trim()).filter(Boolean)
        : [],
      category: data.category ? String(data.category).trim() || undefined : undefined,
      lang: data.lang ? String(data.lang).trim() : locale === "zh" ? "zh-CN" : "en",
      pinned: Boolean(data.pinned),
      wordCount,
      readingTime,
      excerpt: description
        ? description
        : plainText.length > 160
          ? `${plainText.slice(0, 160).trim()}...`
          : plainText.trim(),
    };

    return { locale, filePath, rawContent: content, plainText, meta };
  }

  /**
   * Loads, parses and groups every post file by slug.
   */
  private loadRawPosts(): Map<string, RawPostData> {
    if (this.cache) return this.cache;

    const postMap = new Map<string, RawPostData>();

    for (const { slug, locale, filePath } of this.scanPostFiles()) {
      const parsed = this.parseLocaleFile(filePath, locale, slug);
      let raw = postMap.get(slug);
      if (!raw) {
        raw = { slug, locales: {}, availableLocales: [] };
        postMap.set(slug, raw);
      }
      raw.locales[locale] = parsed;
    }

    // Normalize locale order (zh first) for stable output.
    for (const raw of postMap.values()) {
      raw.availableLocales = LOCALES.filter((locale) => Boolean(raw.locales[locale]));
    }

    this.cache = postMap;
    return postMap;
  }

  /**
   * Normalizes the `(locale?, options?)` / `(options?)` call styles.
   */
  private resolveQuery(arg?: ContentQueryArg, options?: PostQueryOptions): ResolvedQuery {
    if (typeof arg === "string") {
      return { locale: isLocale(arg) ? arg : DEFAULT_LOCALE, options: options ?? {} };
    }
    return { locale: DEFAULT_LOCALE, options: arg ?? options ?? {} };
  }

  /**
   * Builds the public `Post` shape from raw locale data plus post-level aggregates.
   */
  private materialize(raw: RawPostData, data: RawLocaleData, isFallback: boolean): Post {
    return {
      slug: raw.slug,
      ...data.meta,
      availableLocales: [...raw.availableLocales],
      hasTranslation: raw.availableLocales.length > 1,
      contentLocale: data.locale,
      isFallback,
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
   * Finds a raw post by slug. Accepts the canonical directory slug and, for
   * backwards compatibility, a legacy `"<slug>/index"` form. Handles
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
   * Returns all posts that exist in `locale` (default `zh`), sorted with drafts
   * filtered unless `includeDrafts` is true.
   *
   * A post without `index.zh.md` is treated as a draft for the Chinese listing
   * and is only visible through its own locale.
   */
  public async getAllPosts(
    localeOrOptions?: ContentQueryArg,
    maybeOptions?: PostQueryOptions
  ): Promise<Post[]> {
    const { locale, options } = this.resolveQuery(localeOrOptions, maybeOptions);
    const rawMap = this.loadRawPosts();
    const posts: Post[] = [];

    for (const raw of rawMap.values()) {
      const data = raw.locales[locale];
      if (!data) continue;
      if (data.meta.draft && !options.includeDrafts) continue;
      posts.push(this.materialize(raw, data, false));
    }

    return this.sortPosts(posts);
  }

  /**
   * Returns full post details for `locale` (default `zh`).
   *
   * When the requested locale has no version, the Chinese version is served with
   * `isFallback: true`. `translations` carries the pre-rendered HTML of every
   * available locale so the UI can switch language without a second request.
   */
  public async getPostBySlug(
    slug: string,
    localeOrOptions?: ContentQueryArg,
    maybeOptions?: PostQueryOptions
  ): Promise<PostDetail | null> {
    const { locale, options } = this.resolveQuery(localeOrOptions, maybeOptions);
    const rawMap = this.loadRawPosts();
    const raw = this.findRawPost(rawMap, slug);
    if (!raw) return null;

    const isUsable = (data: RawLocaleData | undefined): data is RawLocaleData =>
      Boolean(data) && (!data!.meta.draft || Boolean(options.includeDrafts));

    let data = isUsable(raw.locales[locale]) ? raw.locales[locale] : undefined;
    let isFallback = false;

    if (!data && locale !== DEFAULT_LOCALE && isUsable(raw.locales[DEFAULT_LOCALE])) {
      data = raw.locales[DEFAULT_LOCALE];
      isFallback = true;
    }
    if (!data) return null;

    const sourceLocale = data.locale;
    const rendered = await renderMarkdownToHtml(data.rawContent, raw.slug);

    const translations: Partial<Record<Locale, PostTranslation>> = {};
    for (const availableLocale of raw.availableLocales) {
      const localeData = raw.locales[availableLocale];
      if (!isUsable(localeData)) continue;
      if (availableLocale === sourceLocale) {
        translations[availableLocale] = {
          contentHtml: rendered.contentHtml,
          toc: rendered.toc,
          wordCount: localeData.meta.wordCount,
          readingTime: localeData.meta.readingTime,
        };
        continue;
      }
      const other = await renderMarkdownToHtml(localeData.rawContent, raw.slug);
      translations[availableLocale] = {
        contentHtml: other.contentHtml,
        toc: other.toc,
        wordCount: localeData.meta.wordCount,
        readingTime: localeData.meta.readingTime,
      };
    }

    // Prev/next follow the ordering of the locale the content actually came from.
    const sortedPosts = await this.getAllPosts(sourceLocale, options);
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
      ...this.materialize(raw, data, isFallback),
      contentHtml: rendered.contentHtml,
      toc,
      translations,
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
    const { locale, options } = this.resolveQuery(localeOrOptions, maybeOptions);
    const posts = await this.getAllPosts(locale, options);
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
   * Aggregates all categories with post counts, sorted descending by post count.
   * Posts without a category are grouped under "未分类".
   */
  public async getAllCategories(
    localeOrOptions?: ContentQueryArg,
    maybeOptions?: PostQueryOptions
  ): Promise<CategoryInfo[]> {
    const { locale, options } = this.resolveQuery(localeOrOptions, maybeOptions);
    const posts = await this.getAllPosts(locale, options);
    const countMap: Record<string, number> = {};

    for (const post of posts) {
      const categoryName = post.category || "未分类";
      countMap[categoryName] = (countMap[categoryName] || 0) + 1;
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
   * Returns total post count and total word count for a locale.
   */
  public async getSiteStats(
    localeOrOptions?: ContentQueryArg,
    maybeOptions?: PostQueryOptions
  ): Promise<SiteStats> {
    const { locale, options } = this.resolveQuery(localeOrOptions, maybeOptions);
    const posts = await this.getAllPosts(locale, options);
    const totalPosts = posts.length;
    const totalWordCount = posts.reduce((sum, post) => sum + post.wordCount, 0);

    return {
      totalPosts,
      totalWordCount,
    };
  }

  /**
   * Returns a lightweight search index payload for client-side search.
   * Each item is tagged with its `locale`; English bodies are attached when the
   * post is bilingual and the primary locale is `zh`.
   */
  public async getSearchIndex(
    localeOrOptions?: ContentQueryArg,
    maybeOptions?: PostQueryOptions
  ): Promise<SearchIndexItem[]> {
    const { locale, options } = this.resolveQuery(localeOrOptions, maybeOptions);
    const rawMap = this.loadRawPosts();
    const posts = await this.getAllPosts(locale, options);

    return posts.map((post) => {
      const raw = rawMap.get(post.slug);
      const primary = raw?.locales[post.contentLocale];
      const english = raw?.locales.en;
      const englishUsable = Boolean(english) && (!english!.meta.draft || Boolean(options.includeDrafts));

      const item: SearchIndexItem = {
        slug: post.slug,
        title: post.title,
        description: post.description,
        category: post.category || "未分类",
        tags: post.tags,
        date: post.published,
        wordCount: post.wordCount,
        plainText: primary ? primary.plainText : "",
        locale: post.contentLocale,
      };

      if (post.contentLocale === "zh" && english && englishUsable) {
        item.titleEn = english.meta.title;
        item.plainTextEn = english.plainText;
      }

      return item;
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
export const getAllCategories = (
  localeOrOptions?: ContentQueryArg,
  options?: PostQueryOptions
): Promise<CategoryInfo[]> => contentProvider.getAllCategories(localeOrOptions, options);
export const getSiteStats = (
  localeOrOptions?: ContentQueryArg,
  options?: PostQueryOptions
): Promise<SiteStats> => contentProvider.getSiteStats(localeOrOptions, options);
export const getSearchIndex = (
  localeOrOptions?: ContentQueryArg,
  options?: PostQueryOptions
): Promise<SearchIndexItem[]> => contentProvider.getSearchIndex(localeOrOptions, options);

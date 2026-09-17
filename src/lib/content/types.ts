import type { Locale } from "../../i18n/types";

export type { Locale };

export interface Post {
  slug: string;
  title: string;
  published: string;
  updated?: string;
  draft?: boolean;
  description?: string;
  image?: string;
  tags: string[];
  category?: string;
  lang?: string;
  pinned?: boolean;
  wordCount: number;
  readingTime: string;
  excerpt?: string;
  /** Locales that actually have a source file (`index.zh.md` / `index.en.md`). */
  availableLocales: Locale[];
  /** True when the post ships more than one language version. */
  hasTranslation: boolean;
  /** Locale of the content backing this instance (falls back to `zh`). */
  contentLocale: Locale;
  /** True when the requested locale was missing and `zh` content was served instead. */
  isFallback: boolean;
}

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

/** Rendered payload for a single locale, used by the client-side language switch. */
export interface PostTranslation {
  contentHtml: string;
  toc: TocItem[];
  wordCount: number;
  readingTime: string;
}

export interface PostDetail extends Post {
  /** Rendered HTML for `contentLocale` (equals `translations[contentLocale]`). */
  contentHtml: string;
  toc: TocItem[];
  /**
   * Pre-rendered content for every available locale, so switching language on the
   * article page needs no extra request/navigation.
   */
  translations: Partial<Record<Locale, PostTranslation>>;
  prevPost?: { slug: string; title: string };
  nextPost?: { slug: string; title: string };
}

export interface SearchIndexItem {
  slug: string;
  title: string;
  description?: string;
  category?: string;
  tags: string[];
  date: string;
  wordCount: number;
  plainText: string;
  /** Locale of this entry's primary payload. */
  locale: Locale;
  /** English title, attached when an English version exists and `locale` is `zh`. */
  titleEn?: string;
  /** English body text, attached when an English version exists and `locale` is `zh`. */
  plainTextEn?: string;
}

export interface SiteStats {
  totalPosts: number;
  totalWordCount: number;
}

export interface TagInfo {
  name: string;
  count: number;
}

export interface CategoryInfo {
  name: string;
  count: number;
}

export interface PostQueryOptions {
  includeDrafts?: boolean;
}

/**
 * Accepted first argument of every provider query: either an explicit locale or
 * (backwards compatible) a plain options object, in which case the locale
 * defaults to `zh`.
 */
export type ContentQueryArg = Locale | PostQueryOptions;

export interface IContentProvider {
  getAllPosts(localeOrOptions?: ContentQueryArg, options?: PostQueryOptions): Promise<Post[]>;
  getPostBySlug(
    slug: string,
    localeOrOptions?: ContentQueryArg,
    options?: PostQueryOptions
  ): Promise<PostDetail | null>;
  getAllTags(localeOrOptions?: ContentQueryArg, options?: PostQueryOptions): Promise<TagInfo[]>;
  getAllCategories(
    localeOrOptions?: ContentQueryArg,
    options?: PostQueryOptions
  ): Promise<CategoryInfo[]>;
  getSiteStats(localeOrOptions?: ContentQueryArg, options?: PostQueryOptions): Promise<SiteStats>;
  getSearchIndex(
    localeOrOptions?: ContentQueryArg,
    options?: PostQueryOptions
  ): Promise<SearchIndexItem[]>;
}

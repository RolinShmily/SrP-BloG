export interface Post {
  slug: string;
  title: string;
  published: string;
  updated?: string;
  draft?: boolean;
  description?: string;
  image?: string;
  tags: string[];
  lang?: string;
  pinned?: boolean;
  wordCount: number;
  readingTime: string;
  excerpt?: string;
}

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

export interface PostDetail extends Post {
  contentHtml: string;
  toc: TocItem[];
  prevPost?: { slug: string; title: string };
  nextPost?: { slug: string; title: string };
}

export interface SearchIndexItem {
  slug: string;
  title: string;
  description?: string;
  tags: string[];
  date: string;
  wordCount: number;
  plainText: string;
}

export interface SiteStats {
  totalPosts: number;
  totalWordCount: number;
}

export interface TagInfo {
  name: string;
  count: number;
}

export interface PostQueryOptions {
  includeDrafts?: boolean;
}

export type ContentQueryArg = string | PostQueryOptions;

export interface IContentProvider {
  getAllPosts(localeOrOptions?: ContentQueryArg, options?: PostQueryOptions): Promise<Post[]>;
  getPostBySlug(
    slug: string,
    localeOrOptions?: ContentQueryArg,
    options?: PostQueryOptions
  ): Promise<PostDetail | null>;
  getAllTags(localeOrOptions?: ContentQueryArg, options?: PostQueryOptions): Promise<TagInfo[]>;
  getSiteStats(localeOrOptions?: ContentQueryArg, options?: PostQueryOptions): Promise<SiteStats>;
  getSearchIndex(
    localeOrOptions?: ContentQueryArg,
    options?: PostQueryOptions
  ): Promise<SearchIndexItem[]>;
}

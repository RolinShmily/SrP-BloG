/**
 * Pagefind client-side search adapter.
 *
 * Dynamically imports `/pagefind/pagefind.js` at runtime from the browser,
 * avoiding bundle size bloat and allowing zero-server full-text search.
 */

export interface PagefindSubResult {
  title: string;
  url: string;
  excerpt: string;
}

export interface PagefindResultData {
  url: string;
  raw_url?: string;
  content: string;
  excerpt: string;
  word_count: number;
  meta: {
    title?: string;
    image?: string;
    [key: string]: unknown;
  };
  sub_results?: PagefindSubResult[];
}

export interface PagefindRawResult {
  id: string;
  score: number;
  words: number[];
  data: () => Promise<PagefindResultData>;
}

export interface PagefindSearchResponse {
  results: PagefindRawResult[];
  unfilteredResultCount: number;
}

export interface PagefindInstance {
  init: () => Promise<void>;
  search: (query: string, options?: Record<string, unknown>) => Promise<PagefindSearchResponse>;
  options?: (opts: Record<string, unknown>) => Promise<void>;
  preload?: (query: string) => Promise<void>;
}

let pagefindInstance: PagefindInstance | null = null;
let pagefindInitPromise: Promise<PagefindInstance | null> | null = null;

/**
 * Initializes and caches the Pagefind singleton from `/pagefind/pagefind.js`.
 */
export async function getPagefind(): Promise<PagefindInstance | null> {
  if (typeof window === "undefined") return null;
  if (pagefindInstance) return pagefindInstance;

  if (!pagefindInitPromise) {
    pagefindInitPromise = (async () => {
      try {
        // Dynamically import from browser root.
        // `webpackIgnore: true` prevents Next.js bundler from trying to resolve this at build time.
        // @ts-expect-error - dynamic browser import from public/pagefind
        const pf = (await import(/* webpackIgnore: true */ "/pagefind/pagefind.js")) as PagefindInstance;
        if (pf && typeof pf.init === "function") {
          await pf.init();
          pagefindInstance = pf;
          return pf;
        }
        return null;
      } catch (err) {
        console.warn("[pagefind] Failed to load /pagefind/pagefind.js:", err);
        return null;
      }
    })();
  }

  return pagefindInitPromise;
}

/**
 * Performs a Pagefind search and resolves the top result details.
 */
export async function searchWithPagefind(
  query: string,
  limit = 8
): Promise<{ results: PagefindResultData[]; total: number } | null> {
  const q = query.trim();
  if (!q) return { results: [], total: 0 };

  const pf = await getPagefind();
  if (!pf) return null;

  try {
    const response = await pf.search(q);
    const topResults = response.results.slice(0, limit);
    const resolved = await Promise.all(topResults.map((r) => r.data()));
    return {
      results: resolved,
      total: response.results.length,
    };
  } catch (err) {
    console.error("[pagefind] Search error:", err);
    return null;
  }
}

import type { Post } from "./types";

type DatedPost = Pick<Post, "published" | "title">;

/** Newest first, with a deterministic title tie-breaker; ignores pinned status. */
export function comparePostsByPublishedDate(a: DatedPost, b: DatedPost): number {
  const timeA = new Date(a.published).getTime() || 0;
  const timeB = new Date(b.published).getTime() || 0;
  return timeB - timeA || a.title.localeCompare(b.title, "zh-CN");
}

export function sortPostsByPublishedDate<T extends DatedPost>(posts: readonly T[]): T[] {
  return [...posts].sort(comparePostsByPublishedDate);
}

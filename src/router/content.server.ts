/**
 * Server-only content access for route loaders.
 *
 * The `.server.ts` suffix makes React Router strip this module from the
 * browser bundle, so `node:fs` and the Markdown pipeline never reach the
 * client. Pre-rendering runs these loaders in Node at build time and stores
 * the result in the emitted HTML / `.data` files.
 */
export {
  getAllPosts,
  getAllTags,
  getPostBySlug,
  getSiteStats,
} from "../lib/content/provider";

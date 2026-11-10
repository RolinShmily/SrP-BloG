import { index, route, type RouteConfig } from "@react-router/dev/routes";

/**
 * Route table for the Vite runtime.
 *
 * Note: the Next.js App Router lives in `src/app/`; `src/router` belongs to
 * React Router only. Paths are declared without trailing slashes: React
 * Router matches `/tags` and `/tags/` alike, and the prerender pass writes
 * `<path>/index.html`, which is the layout the static host serves.
 */
export default [
  index("routes/home.tsx"),
  route("posts", "routes/posts.tsx"),
  route("posts/:slug", "routes/post-detail.tsx"),
  route("tags", "routes/tags.tsx"),
  route("tags/:tag", "routes/tag-detail.tsx"),
  route("archives", "routes/archives.tsx"),
  route("friends", "routes/friends.tsx"),
  route("404", "routes/not-found.tsx"),
  route("rss.xml", "routes/rss.ts"),
  route("sitemap.xml", "routes/sitemap.ts"),
  route("robots.txt", "routes/robots.ts"),
] satisfies RouteConfig;

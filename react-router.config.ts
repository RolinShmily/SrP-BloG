/**
 * React Router (framework mode) build configuration.
 *
 * `ssr: false` keeps the deployment fully static; `prerender` makes the build
 * run every matched route's `loader` in Node and emit one HTML + `.data` pair
 * per path. Dynamic article and tag paths therefore have to be listed
 * explicitly; static routes (including resource routes such as `/rss.xml`)
 * come from `getStaticPaths()`.
 *
 * The content modules are imported relatively on purpose: this config is
 * loaded by Vite's config loader, where the `@/*` alias is not guaranteed to
 * be active yet.
 */
import type { Config } from "@react-router/dev/config";
import { getAllPosts, getAllTags } from "./src/lib/content/provider";
import { groupTagInfos } from "./src/lib/tag-routes";

export default {
  // Kept out of the repo-root `app/` on purpose: Next.js treats a top-level
  // `app/` as its App Router and would stop seeing `src/app/`. `src/router`
  // exists only for the Vite runtime.
  appDirectory: "src/router",
  ssr: false,

  async prerender({ getStaticPaths }) {
    const [posts, tags] = await Promise.all([
      getAllPosts({ includeDrafts: false }),
      getAllTags({ includeDrafts: false }),
    ]);

    return [
      ...getStaticPaths(),
      ...posts.map((post) => `/posts/${post.slug}`),
      ...groupTagInfos(tags).map((tag) => `/tags/${tag.name}`),
    ];
  },
} satisfies Config;

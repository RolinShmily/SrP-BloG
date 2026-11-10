import type { MetaFunction } from "react-router";
import { NotFoundView } from "../not-found-view";
import { pageMeta } from "../seo";
import { siteConfig } from "@/config/site";

/**
 * Prerendered at `/404`. `scripts/copy-vite-404.ts` copies the emitted
 * `404/index.html` to `404.html`, which is what Cloudflare's
 * `not_found_handling: "404-page"` serves for unknown URLs.
 */
export const meta: MetaFunction = () =>
  pageMeta({
    title: `${siteConfig.title} - ${siteConfig.subtitle}`,
    description: siteConfig.description,
    appendSiteTitle: false,
    robots: "noindex",
  });

export default function NotFoundRoute() {
  return <NotFoundView />;
}

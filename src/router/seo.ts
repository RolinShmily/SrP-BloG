/**
 * Meta helpers shared by the Vite/React Router route modules.
 *
 * React Router replaces the parent's `meta` with the deepest matched route's
 * `meta` export, so every page has to return the complete descriptor set
 * (title, description, canonical, Open Graph, Twitter) rather than relying on
 * the root route as Next.js metadata did.
 */
import type { MetaDescriptor } from "react-router";
import { siteConfig } from "@/config/site";

export interface PageMetaOptions {
  /** Page title without the site suffix (unless `appendSiteTitle` is false). */
  title: string;
  description: string;
  /** Site-relative path with a trailing slash, used for canonical and og:url. */
  path?: string;
  image?: string;
  keywords?: string[];
  /** Values for `<meta name="robots">`; omitted entirely when not provided. */
  robots?: string;
  /** The home page already supplies a complete title, so it opts out. */
  appendSiteTitle?: boolean;
}

/** Resolves a site-relative path, or passes an already-absolute URL through. */
export function absoluteUrl(value: string): string {
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) return value;
  return `${siteConfig.url}${value.startsWith("/") ? value : `/${value}`}`;
}

/** Builds the full metadata descriptor list for a static page. */
export function pageMeta({
  title,
  description,
  path,
  image = siteConfig.ogImage,
  keywords,
  robots,
  appendSiteTitle = true,
}: PageMetaOptions): MetaDescriptor[] {
  const fullTitle = appendSiteTitle ? `${title} | ${siteConfig.title}` : title;
  const canonical = path ? absoluteUrl(path) : undefined;
  const imageUrl = absoluteUrl(image);

  const canonicalMeta: MetaDescriptor[] = canonical
    ? [
        { tagName: "link", rel: "canonical", href: canonical },
        { property: "og:url", content: canonical },
      ]
    : [];

  return [
    { title: fullTitle },
    { name: "description", content: description },
    ...(keywords?.length ? [{ name: "keywords", content: keywords.join(",") }] : []),
    { name: "author", content: siteConfig.author },
    { name: "creator", content: siteConfig.author },
    { tagName: "link", rel: "author", href: siteConfig.homeUrl },
    ...(robots ? [{ name: "robots", content: robots }] : []),
    ...canonicalMeta,
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: siteConfig.title },
    { property: "og:title", content: fullTitle },
    { property: "og:description", content: description },
    { property: "og:locale", content: "zh_CN" },
    { property: "og:locale:alternate", content: "en_US" },
    { property: "og:image", content: imageUrl },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:image:alt", content: fullTitle },
    { property: "og:image:type", content: "image/png" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:creator", content: siteConfig.author },
    { name: "twitter:title", content: fullTitle },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: imageUrl },
    { name: "twitter:image:width", content: "1200" },
    { name: "twitter:image:height", content: "630" },
    { name: "twitter:image:alt", content: fullTitle },
  ];
}

/**
 * Meta helpers shared by the React Router route modules.
 *
 * React Router replaces the parent's `meta` with the deepest matched route's
 * `meta` export, so every page has to return the complete descriptor set
 * (title, description, canonical, Open Graph, Twitter) rather than relying on
 * the root route.
 */
import type { MetaDescriptor } from "react-router";
import { siteConfig } from "@/config/site";
import type { Post } from "@/lib/content";

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

/**
 * Builds the full descriptor set for an article page: Open Graph `article`
 * metadata, Twitter card and the schema.org BlogPosting block.
 */
export function postMeta(post: Post): MetaDescriptor[] {
  const description = post.description || post.excerpt || siteConfig.description;
  const url = `${siteConfig.url}/posts/${post.slug}/`;
  const fullTitle = `${post.title} | ${siteConfig.title}`;
  const image = post.image
    ? new URL(post.image, siteConfig.url).toString()
    : `${siteConfig.url}/og/posts/${post.slug}.png`;

  return [
    { title: fullTitle },
    { name: "description", content: description },
    { name: "keywords", content: post.tags.join(",") },
    { name: "author", content: siteConfig.author },
    { name: "creator", content: siteConfig.author },
    { tagName: "link", rel: "author", href: siteConfig.homeUrl },
    { tagName: "link", rel: "canonical", href: url },
    { property: "og:type", content: "article" },
    { property: "og:site_name", content: siteConfig.title },
    { property: "og:title", content: fullTitle },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
    { property: "og:locale", content: post.lang === "en" ? "en_US" : "zh_CN" },
    { property: "og:image", content: image },
    { property: "og:image:alt", content: post.title },
    // The fallback OG card is generated at exactly 1200x630; a post-supplied
    // cover may have any dimensions, so only advertise them for the fallback.
    ...(post.image
      ? []
      : [
          { property: "og:image:width", content: "1200" },
          { property: "og:image:height", content: "630" },
          { property: "og:image:type", content: "image/png" },
        ]),
    { property: "article:published_time", content: post.published },
    { property: "article:modified_time", content: post.updated || post.published },
    { property: "article:author", content: siteConfig.author },
    ...(post.tags[0] ? [{ property: "article:section", content: post.tags[0] }] : []),
    ...post.tags.map((tag) => ({ property: "article:tag", content: tag })),
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:creator", content: siteConfig.author },
    { name: "twitter:title", content: fullTitle },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image },
    { "script:ld+json": articleJsonLd(post) },
  ];
}

/** Creates schema.org BlogPosting data matching the visible article and metadata. */
export function articleJsonLd(post: Post) {
  const articleUrl = new URL(`/posts/${post.slug}/`, siteConfig.url).toString();
  const imageUrl = new URL(
    post.image || `/og/posts/${post.slug}.png`,
    siteConfig.url
  ).toString();

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl,
    },
    headline: post.title,
    description: post.description || post.excerpt || siteConfig.description,
    image: [imageUrl],
    datePublished: post.published,
    dateModified: post.updated || post.published,
    author: {
      "@type": "Person",
      name: siteConfig.author,
      url: siteConfig.homeUrl,
    },
    keywords: post.tags,
    inLanguage: post.lang === "en" ? "en-US" : "zh-CN",
    wordCount: post.wordCount,
  };
}

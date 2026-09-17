import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import type { Post } from "@/lib/content";

export interface PageMetadataOptions {
  title: string;
  description: string;
  path?: string;
  image?: string;
  keywords?: string[];
}

/**
 * Creates standardized Open Graph and Twitter card metadata for a static page.
 *
 * All relative URLs are resolved against `metadataBase` defined in `RootLayout`.
 */
export function createPageMetadata(options: PageMetadataOptions): Metadata {
  const { title, description, path, image = siteConfig.ogImage, keywords } = options;
  const canonical = path ? (path.startsWith("/") ? path : `/${path}`) : undefined;

  return {
    title,
    description,
    keywords,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      type: "website",
      title,
      description,
      url: canonical,
      siteName: siteConfig.title,
      locale: "zh_CN",
      alternateLocale: ["en_US"],
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: `${title} | ${siteConfig.title}`,
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      creator: siteConfig.author,
      images: [image],
    },
  };
}

/**
 * Creates rich Open Graph (type: article) and Twitter card metadata for a blog post.
 *
 * Falls back gracefully to `siteConfig.ogImage` when the article does not specify
 * its own co-located or remote cover image, ensuring every shared link renders
 * a crisp preview card across social platforms and messaging apps.
 */
export function createPostMetadata(post: Post): Metadata {
  const postUrl = `/posts/${post.slug}/`;
  const postDescription = post.description || post.excerpt || siteConfig.description;

  const postImage = post.image
    ? {
        url: post.image,
        alt: post.title,
      }
    : {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: post.title,
        type: "image/png" as const,
      };

  return {
    title: post.title,
    description: postDescription,
    keywords: post.tags,
    authors: [{ name: siteConfig.author, url: siteConfig.homeUrl }],
    alternates: {
      canonical: postUrl,
    },
    openGraph: {
      type: "article",
      url: postUrl,
      siteName: siteConfig.title,
      title: post.title,
      description: postDescription,
      locale: post.lang === "en" ? "en_US" : "zh_CN",
      publishedTime: post.published,
      modifiedTime: post.updated || post.published,
      authors: [siteConfig.author],
      section: post.tags[0],
      tags: post.tags,
      images: [postImage],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: postDescription,
      creator: siteConfig.author,
      images: [postImage.url],
    },
  };
}

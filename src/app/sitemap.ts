import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/content";
import { siteConfig } from "@/config/site";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts("zh", { includeDrafts: false });

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteConfig.url}/`, changeFrequency: "daily", priority: 1 },
    { url: `${siteConfig.url}/posts/`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteConfig.url}/tags/`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${siteConfig.url}/archives/`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${siteConfig.url}/friends/`, changeFrequency: "monthly", priority: 0.5 },
  ];

  const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${siteConfig.url}/posts/${encodeURI(post.slug)}/`,
    lastModified: post.updated || post.published,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...postRoutes];
}

import { getAllPosts, getAllTags } from "../content.server";
import { siteConfig } from "@/config/site";
import { groupTagInfos } from "@/lib/tag-routes";

type ChangeFrequency = "daily" | "weekly" | "monthly";

interface SitemapEntry {
  url: string;
  lastModified?: string;
  changeFrequency: ChangeFrequency;
  priority: number;
}

/** Escapes a value for XML element content. */
function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function buildSitemapEntries(
  posts: Awaited<ReturnType<typeof getAllPosts>>,
  tags: Awaited<ReturnType<typeof getAllTags>>
): SitemapEntry[] {
  const staticRoutes: SitemapEntry[] = [
    { url: `${siteConfig.url}/`, changeFrequency: "daily", priority: 1 },
    { url: `${siteConfig.url}/posts/`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteConfig.url}/tags/`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${siteConfig.url}/archives/`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${siteConfig.url}/friends/`, changeFrequency: "monthly", priority: 0.5 },
  ];

  const tagRoutes: SitemapEntry[] = groupTagInfos(tags)
    .filter((tag) => tag.count > 1)
    .map((tag) => ({
      url: `${siteConfig.url}/tags/${encodeURIComponent(tag.name)}/`,
      changeFrequency: "weekly",
      priority: 0.5,
    }));

  const postRoutes: SitemapEntry[] = posts.map((post) => ({
    url: `${siteConfig.url}/posts/${encodeURI(post.slug)}/`,
    lastModified: post.updated || post.published,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...tagRoutes, ...postRoutes];
}

function buildSitemapXml(entries: SitemapEntry[]): string {
  const urls = entries
    .map((entry) => {
      const lines = [
        "  <url>",
        `    <loc>${escapeXml(entry.url)}</loc>`,
        ...(entry.lastModified ? [`    <lastmod>${escapeXml(entry.lastModified)}</lastmod>`] : []),
        `    <changefreq>${entry.changeFrequency}</changefreq>`,
        `    <priority>${entry.priority}</priority>`,
        "  </url>",
      ];
      return lines.join("\n");
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

/** Resource route: emits `build/client/sitemap.xml` during prerender. */
export async function loader() {
  const [posts, tags] = await Promise.all([
    getAllPosts("zh", { includeDrafts: false }),
    getAllTags("zh", { includeDrafts: false }),
  ]);

  return new Response(buildSitemapXml(buildSitemapEntries(posts, tags)), {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=0, must-revalidate",
    },
  });
}

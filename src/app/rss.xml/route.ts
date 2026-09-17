import { getAllPosts } from "@/lib/content";
import { siteConfig } from "@/config/site";

export const dynamic = "force-static";

/** Escapes text for use inside XML element content. */
function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

/** Wraps text in a CDATA section, splitting any embedded `]]>` safely. */
function cdata(value: string): string {
  return `<![CDATA[${value.replaceAll("]]>", "]]]]><![CDATA[>")}]]>`;
}

/** RFC 822 date required by RSS 2.0; falls back to build time for bad input. */
function toRfc822(value: string): string {
  const date = new Date(value);
  const safe = Number.isNaN(date.getTime()) ? new Date() : date;
  return safe.toUTCString();
}

/** Absolute, trailing-slash-consistent post URL with percent-encoded CJK slug. */
function postUrl(slug: string): string {
  return `${siteConfig.url}/posts/${encodeURI(slug)}/`;
}

export async function GET() {
  const posts = await getAllPosts("zh", { includeDrafts: false });

  // Canonical feed order is strictly newest-first (drop the pinned-first sort).
  const ordered = [...posts].sort(
    (a, b) => new Date(b.published).getTime() - new Date(a.published).getTime()
  );

  const lastBuildDate = ordered[0]?.published ?? new Date().toISOString();
  const feedUrl = `${siteConfig.url}${siteConfig.rssUrl}`;

  const items = ordered
    .map((post) => {
      const link = postUrl(post.slug);
      const description = post.description || post.excerpt || post.title;
      const categories = post.tags
        .map((tag) => `      <category>${escapeXml(tag)}</category>`)
        .join("\n");

      return [
        "    <item>",
        `      <title>${escapeXml(post.title)}</title>`,
        `      <link>${escapeXml(link)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(link)}</guid>`,
        `      <pubDate>${toRfc822(post.published)}</pubDate>`,
        `      <description>${cdata(description)}</description>`,
        categories,
        "    </item>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteConfig.title)}</title>
    <link>${escapeXml(`${siteConfig.url}/`)}</link>
    <description>${escapeXml(siteConfig.description)}</description>
    <language>zh-CN</language>
    <lastBuildDate>${toRfc822(lastBuildDate)}</lastBuildDate>
    <generator>SrP-BloG</generator>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=0, must-revalidate",
    },
  });
}

import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { useLoaderData } from "react-router";
import { getPostBySlug } from "../content.server";
import { ArticleView } from "@/components/blog/article-view";
import { createArticleJsonLd } from "@/lib/seo";
import { siteConfig } from "@/config/site";

export async function loader({ params }: LoaderFunctionArgs) {
  const slug = params.slug;
  if (!slug) throw new Response("Not Found", { status: 404 });

  const post = await getPostBySlug(slug, { includeDrafts: false });
  if (!post) throw new Response("Not Found", { status: 404 });

  return { post };
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data?.post) {
    return [{ title: "文章未找到" }];
  }

  const post = data.post;
  const description = post.description || post.excerpt || siteConfig.description;
  const url = `${siteConfig.url}/posts/${post.slug}/`;
  const image = post.image
    ? new URL(post.image, siteConfig.url).toString()
    : `${siteConfig.url}/og/posts/${post.slug}.png`;

  return [
    { title: `${post.title} | ${siteConfig.title}` },
    { name: "description", content: description },
    { name: "keywords", content: post.tags.join(",") },
    { name: "author", content: siteConfig.author },
    { name: "creator", content: siteConfig.author },
    { tagName: "link", rel: "author", href: siteConfig.homeUrl },
    { tagName: "link", rel: "canonical", href: url },
    { property: "og:type", content: "article" },
    { property: "og:site_name", content: siteConfig.title },
    { property: "og:title", content: `${post.title} | ${siteConfig.title}` },
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
    { name: "twitter:title", content: `${post.title} | ${siteConfig.title}` },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image },
    { "script:ld+json": createArticleJsonLd(post) },
  ];
};

export default function PostDetailRoute() {
  const { post } = useLoaderData<typeof loader>();

  return (
    <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
      <ArticleView post={post} />
    </main>
  );
}

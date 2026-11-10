import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { useLoaderData } from "react-router";
import { getAllPosts, getAllTags } from "../content.server";
import { PostCard } from "@/components/blog/post-card";
import { T } from "@/components/i18n/t";
import { Link } from "@nav";
import { groupTagInfos, normalizeTagKey } from "@/lib/tag-routes";
import { pageMeta } from "../seo";

/**
 * React Router's `matchPath` leaves dynamic params percent-encoded, so a tag
 * route still has to decode its own param (same as the Next.js page did).
 */
function decodeTag(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch (error) {
    if (error instanceof URIError) return value;
    throw error;
  }
}

export async function loader({ params }: LoaderFunctionArgs) {
  const rawTag = params.tag;
  if (!rawTag) throw new Response("Not Found", { status: 404 });

  const tag = decodeTag(rawTag);
  const [tags, posts] = await Promise.all([
    getAllTags({ includeDrafts: false }),
    getAllPosts({ includeDrafts: false }),
  ]);
  const info = groupTagInfos(tags).find(
    (entry) => normalizeTagKey(entry.name) === normalizeTagKey(tag)
  );

  if (!info) throw new Response("Not Found", { status: 404 });

  const tagKey = normalizeTagKey(info.name);
  const taggedPosts = posts.filter((post) =>
    post.tags.some((postTag) => normalizeTagKey(postTag) === tagKey)
  );

  return { info, posts: taggedPosts };
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) {
    return pageMeta({
      title: "标签未找到",
      description: "未找到该标签对应的文章。",
      robots: "noindex, follow",
    });
  }

  const { info } = data;

  return pageMeta({
    title: `${info.name} 技术文章与实践`,
    description: `浏览本站按“${info.name}”主题整理的 ${info.count} 篇文章与实践记录。文章列表按发布时间排列，可继续查看该主题的背景知识、具体操作步骤、配置示例和实践经验。`,
    path: `/tags/${encodeURIComponent(info.name)}/`,
    keywords: [info.name],
    // Single-post tag pages are useful for navigation but too thin to target as
    // standalone search landing pages. Keep links crawlable without indexing them.
    robots: info.count > 1 ? "index, follow" : "noindex, follow",
  });
};

export default function TagDetailRoute() {
  const { info, posts } = useLoaderData<typeof loader>();

  return (
    <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      <header className="space-y-3">
        <Link
          href="/tags/"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <T zh="全部标签" en="All tags" />
        </Link>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
          {info.name} <T zh="相关文章" en="Articles" />
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          <T
            zh={`“${info.name}”主题下共收录 ${info.count} 篇文章。`}
            en={`${info.count} articles filed under “${info.name}”.`}
          />
        </p>
      </header>

      <section className="space-y-4" aria-labelledby="tag-articles-heading">
        <h2 id="tag-articles-heading" className="text-lg font-semibold tracking-tight">
          <T zh="文章列表" en="Articles" />
        </h2>
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      </section>
    </main>
  );
}

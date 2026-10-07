import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllPosts, getAllTags } from "@/lib/content";
import { createPageMetadata } from "@/lib/seo";
import { PostCard } from "@/components/blog/post-card";
import { T } from "@/components/i18n/t";
import { groupTagInfos, normalizeTagKey } from "@/lib/tag-routes";

export const dynamic = "force-static";
export const dynamicParams = false;

interface TagPageProps {
  params: Promise<{ tag: string }>;
}

function decodeTag(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch (error) {
    if (error instanceof URIError) return value;
    throw error;
  }
}

export async function generateStaticParams() {
  const tags = await getAllTags({ includeDrafts: false });
  return groupTagInfos(tags).map(({ name }) => ({ tag: name }));
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { tag: rawTag } = await params;
  const tag = decodeTag(rawTag);
  const info = groupTagInfos(await getAllTags({ includeDrafts: false })).find(
    (entry) => normalizeTagKey(entry.name) === normalizeTagKey(tag)
  );

  if (!info) {
    return {
      title: "标签未找到",
      robots: { index: false, follow: false },
    };
  }

  const metadata = createPageMetadata({
    title: `${info.name} 技术文章与实践`,
    description: `浏览本站按“${info.name}”主题整理的 ${info.count} 篇文章与实践记录。文章列表按发布时间排列，可继续查看该主题的背景知识、具体操作步骤、配置示例和实践经验。`,
    path: `/tags/${encodeURIComponent(info.name)}/`,
    keywords: [info.name],
  });

  return {
    ...metadata,
    // Single-post tag pages are useful for navigation but too thin to target as
    // standalone search landing pages. Keep links crawlable without indexing them.
    robots: { index: info.count > 1, follow: true },
  };
}

export default async function TagPage({ params }: TagPageProps) {
  const { tag: rawTag } = await params;
  const tag = decodeTag(rawTag);
  const [tags, posts] = await Promise.all([
    getAllTags({ includeDrafts: false }),
    getAllPosts({ includeDrafts: false }),
  ]);
  const info = groupTagInfos(tags).find(
    (entry) => normalizeTagKey(entry.name) === normalizeTagKey(tag)
  );

  if (!info) notFound();

  const displayTag = info.name;
  const tagKey = normalizeTagKey(displayTag);
  const taggedPosts = posts.filter((post) =>
    post.tags.some((postTag) => normalizeTagKey(postTag) === tagKey)
  );

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
          {displayTag} <T zh="相关文章" en="Articles" />
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          <T
            zh={`“${displayTag}”主题下共收录 ${info.count} 篇文章。`}
            en={`${info.count} articles filed under “${displayTag}”.`}
          />
        </p>
      </header>

      <section className="space-y-4" aria-labelledby="tag-articles-heading">
        <h2 id="tag-articles-heading" className="text-lg font-semibold tracking-tight">
          <T zh="文章列表" en="Articles" />
        </h2>
        <div className="space-y-3">
          {taggedPosts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      </section>
    </main>
  );
}

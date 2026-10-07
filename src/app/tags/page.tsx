import { Suspense } from "react";
import type { Metadata } from "next";
import { getAllPosts, getAllTags } from "@/lib/content";
import { createPageMetadata } from "@/lib/seo";
import { TagsView } from "@/components/blog/tags-view";
import { dictionaries } from "@/i18n";

export const dynamic = "force-static";

export const metadata: Metadata = createPageMetadata({
  title: "标签 (Tags)",
  description: "浏览本站所有技术文章的主题标签和文章数量，筛选相关教程、配置记录与实践内容；选择主题后可查看该类文章，并继续追踪相关背景和操作经验。",
  path: "/tags/",
});

export default async function TagsPage() {
  const [posts, tags] = await Promise.all([
    getAllPosts({ includeDrafts: false }),
    getAllTags({ includeDrafts: false }),
  ]);

  return (
    <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
      {/* useSearchParams() requires a Suspense boundary during static export. */}
      <Suspense
        fallback={
          <div className="py-20 text-center text-sm text-muted-foreground">
            {dictionaries.zh.common.loading}
          </div>
        }
      >
        <TagsView posts={posts} tags={tags} />
      </Suspense>
    </main>
  );
}

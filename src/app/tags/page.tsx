import { Suspense } from "react";
import type { Metadata } from "next";
import { getAllPosts, getAllTags } from "@/lib/content";
import { createPageMetadata } from "@/lib/seo";
import { TagsView } from "@/components/blog/tags-view";
import { dictionaries } from "@/i18n";

export const dynamic = "force-static";

export const metadata: Metadata = createPageMetadata({
  title: "标签 (Tags)",
  description: "按关键词标签浏览全站文章，快速定位感兴趣的技术主题与实践教程。",
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

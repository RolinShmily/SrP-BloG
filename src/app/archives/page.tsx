import type { Metadata } from "next";
import { getSiteStats, getAllPosts } from "@/lib/content";
import { createPageMetadata } from "@/lib/seo";
import { ArchivesView } from "@/components/blog/archives-view";

export const dynamic = "force-static";

export const metadata: Metadata = createPageMetadata({
  title: "文章归档与搜索 (Archives)",
  description: "按年份与时间线浏览本站所有文章，使用全文搜索定位技术主题，并查看文章数量、总字数等归档统计，回顾已发布的教程与实践记录。",
  path: "/archives/",
});

export default async function ArchivesPage() {
  const [stats, posts] = await Promise.all([
    getSiteStats({ includeDrafts: false }),
    getAllPosts({ includeDrafts: false }),
  ]);

  return (
    <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
      <ArchivesView stats={stats} posts={posts} />
    </main>
  );
}

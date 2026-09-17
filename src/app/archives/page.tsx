import type { Metadata } from "next";
import { getSiteStats, getAllPosts } from "@/lib/content";
import { ArchivesView } from "@/components/blog/archives-view";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "文章归档与搜索 (Archives)",
  description: "全站文章按年份时间线归档与多维度实时全文检索，查看建站字数与文章统计。",
};

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

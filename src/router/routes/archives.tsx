import type { MetaFunction } from "react-router";
import { useLoaderData } from "react-router";
import { getAllPosts, getSiteStats } from "../content.server";
import { ArchivesView } from "@/components/blog/archives-view";
import { pageMeta } from "../seo";

export async function loader() {
  const [stats, posts] = await Promise.all([
    getSiteStats({ includeDrafts: false }),
    getAllPosts({ includeDrafts: false }),
  ]);
  return { stats, posts };
}

export const meta: MetaFunction = () =>
  pageMeta({
    title: "文章归档与搜索 (Archives)",
    description:
      "按年份与时间线浏览本站所有文章，使用全文搜索定位技术主题，并查看文章数量、总字数等归档统计，回顾已发布的教程与实践记录。",
    path: "/archives/",
  });

export default function ArchivesRoute() {
  const { stats, posts } = useLoaderData<typeof loader>();

  return (
    <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
      <ArchivesView stats={stats} posts={posts} />
    </main>
  );
}

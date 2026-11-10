import type { MetaFunction } from "react-router";
import { useLoaderData } from "react-router";
import { getAllPosts, getAllTags } from "../content.server";
import { TagsView } from "@/components/blog/tags-view";
import { pageMeta } from "../seo";

export async function loader() {
  const [posts, tags] = await Promise.all([
    getAllPosts({ includeDrafts: false }),
    getAllTags({ includeDrafts: false }),
  ]);
  return { posts, tags };
}

export const meta: MetaFunction = () =>
  pageMeta({
    title: "标签 (Tags)",
    description:
      "浏览本站所有技术文章的主题标签和文章数量，筛选相关教程、配置记录与实践内容；选择主题后可查看该类文章，并继续追踪相关背景和操作经验。",
    path: "/tags/",
  });

export default function TagsRoute() {
  const { posts, tags } = useLoaderData<typeof loader>();

  return (
    <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
      <TagsView posts={posts} tags={tags} />
    </main>
  );
}

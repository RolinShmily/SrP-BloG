import { getAllPosts } from "@/lib/content";
import { PostsList } from "@/components/blog/posts-list";
import { createPageMetadata } from "@/lib/seo";
import { siteConfig } from "@/config/site";
import type { Metadata } from "next";

export const dynamic = "force-static";

export const metadata: Metadata = createPageMetadata({
  title: "文章列表 (Posts)",
  description: "浏览全部技术分享、教程与实战文章。",
  path: "/posts/",
});

export default async function PostsPage() {
  const posts = await getAllPosts({ includeDrafts: false });

  return (
    <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 space-y-10">
      {/* Post List */}
      <PostsList posts={posts} pageSize={siteConfig.postsPerPage} />
    </main>
  );
}

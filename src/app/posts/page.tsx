import { getAllPosts } from "@/lib/content";
import { PostsList } from "@/components/blog/posts-list";
import { createPageMetadata } from "@/lib/seo";
import { siteConfig } from "@/config/site";
import { T } from "@/components/i18n/t";
import type { Metadata } from "next";

export const dynamic = "force-static";

export const metadata: Metadata = createPageMetadata({
  title: "文章列表 (Posts)",
  description: "按发布时间浏览 SrP-BloG 的全部技术文章，涵盖编程开发、Windows 与 Linux 配置、网络运维、容器部署和游戏实践。",
  path: "/posts/",
});

export default async function PostsPage() {
  const posts = await getAllPosts({ includeDrafts: false });

  return (
    <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 space-y-10">
      <header className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
          <T zh="全部文章" en="All posts" />
        </h1>
        <p className="text-sm text-muted-foreground">
          <T zh="按时间浏览本站的技术文章与实践记录。" en="Browse the site’s technical articles and practical notes by date." />
        </p>
      </header>
      {/* Post List */}
      <PostsList posts={posts} pageSize={siteConfig.postsPerPage} />
    </main>
  );
}

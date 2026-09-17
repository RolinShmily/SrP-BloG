import { getAllPosts } from "@/lib/content";
import { SpotlightHero } from "@/components/blog/spotlight-hero";
import { PostsList } from "@/components/blog/posts-list";
import { T } from "@/components/i18n/t";
import { dictionaries } from "@/i18n";
import type { Metadata } from "next";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "文章列表 (Posts)",
  description: "浏览全部技术分享、教程与实战文章。",
};

const zh = dictionaries.zh;
const en = dictionaries.en;

export default async function PostsPage() {
  const posts = await getAllPosts({ includeDrafts: false });
  const pinnedPost = posts.find((p) => p.pinned);

  return (
    <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 space-y-10">
      {/* Header */}
      <div className="space-y-1 pb-2">
        <T
          as="h1"
          className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground"
          zh={zh.pages.posts.title}
          en={en.pages.posts.title}
        />
        <T
          as="p"
          className="text-sm text-muted-foreground"
          zh={zh.pages.posts.description}
          en={en.pages.posts.description}
        />
      </div>

      {/* Pinned Post Hero */}
      {pinnedPost && <SpotlightHero post={pinnedPost} />}

      {/* Post List */}
      <PostsList posts={posts} pageSize={8} />
    </main>
  );
}

import { getAllPosts } from "@/lib/content";
import { PostsList } from "@/components/blog/posts-list";
import { siteConfig } from "@/config/site";
import { T } from "@/components/i18n/t";
import type { Metadata } from "next";

export const dynamic = "force-static";
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const posts = await getAllPosts({ includeDrafts: false });

  return (
    <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
          <T zh={siteConfig.subtitle} en="Technical Notes & Practical Guides" />
        </h1>
      </header>

      {/* Post List */}
      <PostsList posts={posts} pageSize={siteConfig.postsPerPage} />
    </main>
  );
}

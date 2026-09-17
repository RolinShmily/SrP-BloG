import { getAllPosts } from "@/lib/content";
import { PostsList } from "@/components/blog/posts-list";

export const dynamic = "force-static";

export default async function HomePage() {
  const posts = await getAllPosts({ includeDrafts: false });

  return (
    <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 space-y-10">
      {/* Post List */}
      <PostsList posts={posts} pageSize={8} />
    </main>
  );
}

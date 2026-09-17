import { getAllPosts } from "@/lib/content";
import { SpotlightHero } from "@/components/blog/spotlight-hero";
import { PostsList } from "@/components/blog/posts-list";
import { T } from "@/components/i18n/t";
import { siteConfig } from "@/config/site";
import { dictionaries } from "@/i18n";

export const dynamic = "force-static";

const zh = dictionaries.zh;
const en = dictionaries.en;

export default async function HomePage() {
  const posts = await getAllPosts({ includeDrafts: false });
  const pinnedPost = posts.find((p) => p.pinned);

  return (
    <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 space-y-10">
      {/* Site Intro Header */}
      <div className="space-y-2 pb-2">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
          {siteConfig.title}
        </h1>
        <T
          as="p"
          className="text-sm text-muted-foreground leading-relaxed max-w-2xl"
          zh={zh.pages.home.tagline}
          en={en.pages.home.tagline}
        />
      </div>

      {/* Pinned Post Hero */}
      {pinnedPost && <SpotlightHero post={pinnedPost} />}

      {/* Post List */}
      <PostsList posts={posts} pageSize={8} />
    </main>
  );
}

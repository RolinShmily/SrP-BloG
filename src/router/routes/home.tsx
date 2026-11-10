import type { MetaFunction } from "react-router";
import { useLoaderData } from "react-router";
import { getAllPosts } from "../content.server";
import { PostsList } from "@/components/blog/posts-list";
import { siteConfig } from "@/config/site";
import { T } from "@/components/i18n/t";
import { pageMeta } from "../seo";

export async function loader() {
  const posts = await getAllPosts({ includeDrafts: false });
  return { posts };
}

export const meta: MetaFunction = () =>
  pageMeta({
    // The home page supplies its own complete title rather than the site's
    // `%s | site` suffix used by child pages.
    title: `${siteConfig.title} - ${siteConfig.subtitle}`,
    description: siteConfig.description,
    path: "/",
    keywords: siteConfig.keywords,
    appendSiteTitle: false,
  });

export default function HomeRoute() {
  const { posts } = useLoaderData<typeof loader>();

  return (
    <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
          <T zh={siteConfig.subtitle} en="Technical Notes & Practical Guides" />
        </h1>
      </header>

      <PostsList posts={posts} pageSize={siteConfig.postsPerPage} />
    </main>
  );
}

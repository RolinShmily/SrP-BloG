import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { useLoaderData } from "react-router";
import { getPostBySlug } from "../content.server";
import { ArticleView } from "@/components/blog/article-view";
import { postMeta } from "../seo";

export async function loader({ params }: LoaderFunctionArgs) {
  const slug = params.slug;
  if (!slug) throw new Response("Not Found", { status: 404 });

  const post = await getPostBySlug(slug, { includeDrafts: false });
  if (!post) throw new Response("Not Found", { status: 404 });

  return { post };
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data?.post) {
    return [{ title: "文章未找到" }];
  }

  return postMeta(data.post);
};

export default function PostDetailRoute() {
  const { post } = useLoaderData<typeof loader>();

  return (
    <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
      <ArticleView post={post} />
    </main>
  );
}

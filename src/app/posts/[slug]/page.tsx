import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllPosts, getPostBySlug } from "@/lib/content";
import { ArticleView } from "@/components/blog/article-view";

export const dynamic = "force-static";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = await getAllPosts({ includeDrafts: false });
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug, { includeDrafts: false });

  if (!post) {
    return {
      title: "文章未找到",
    };
  }

  return {
    title: post.title,
    description: post.description || post.excerpt,
    keywords: post.tags,
    openGraph: {
      title: post.title,
      description: post.description || post.excerpt,
      type: "article",
      publishedTime: post.published,
      modifiedTime: post.updated,
      tags: post.tags,
      images: post.image ? [post.image] : undefined,
    },
  };
}

export default async function PostDetailPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug, { includeDrafts: false });

  if (!post) {
    notFound();
  }

  return (
    <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
      <ArticleView post={post} />
    </main>
  );
}

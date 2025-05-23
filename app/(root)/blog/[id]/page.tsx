import { getBlogById } from "@/lib/actions/blog.actions";
import { Metadata } from "next";
import ClientBlogPage from "./client";
import { BlogService } from "@/services/blog.service";

// * Metadata generation
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  try {
    const id = (await params).id;
    const result = await BlogService.getBlogById(id);

    if (!result.success || !result.data) {
      return {
        title: "Blog Post Not Found",
      };
    }

    const post = result.data;

    return {
      title: post.metaTitle || post.heading,
      description: post.metaDescription,
      keywords: post.metaKeywords,
      openGraph: {
        title: post.metaTitle || post.heading,
        description: post.metaDescription,
        images: post.imageId
          ? [
              {
                url: `/api/files/${post.imageId}`,
                width: 1200,
                height: 630,
                alt: post.heading,
              },
            ]
          : [],
        type: "article",
      },
      twitter: {
        card: "summary_large_image",
        title: post.metaTitle || post.heading,
        description: post.metaDescription,
        images: post.imageId ? [`/api/files/${post.imageId}`] : [],
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Blog Post",
      description: "Read our latest blog post",
    };
  }
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = (await params).id;

  const initialBlog = await getBlogById(id);
  return <ClientBlogPage initialBlog={initialBlog ?? null} />;
}

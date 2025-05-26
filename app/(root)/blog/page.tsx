import { Metadata } from "next";
import { getPublicBlogs } from "@/lib/actions/blog.actions";
import ClientFeaturesAndBlogs from "./client";
import { BlogService } from "@/services/blog.service";
export const dynamic = "force-dynamic";

// * Generate metadata for the blogs
export async function generateMetadata(): Promise<Metadata> {
  const result = await BlogService.getBlogs();
  const blogs = result.data || [];

  const titles = blogs.map((blog) => blog.metaTitle).join(", ");
  const descriptions = blogs.map((blog) => blog.metaDescription).join(". ");

  const keywordsSet = new Set<string>();
  blogs.forEach((blog) => {
    if (blog.metaKeywords) {
      blog.metaKeywords.split(",").forEach((keyword: string) => {
        keywordsSet.add(keyword.trim());
      });
    }
  });
  const keywords = Array.from(keywordsSet).join(", ");

  return {
    title: `Our Blog - Latest Posts and Updates | ${titles.substring(
      0,
      60
    )}...`,
    description: descriptions.substring(0, 160),
    keywords: keywords,
    openGraph: {
      title: "Our Blog - Latest Posts and Updates",
      description: descriptions.substring(0, 160),
      images: blogs.length > 0 ? [`/api/files/${blogs[0].imageId}`] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Our Blog - Latest Posts and Updates",
      description: descriptions.substring(0, 160),
      images: blogs.length > 0 ? [`/api/files/${blogs[0].imageId}`] : [],
    },
  };
}

export default async function BlogPage() {
  const initialBlog = await getPublicBlogs();
  return <ClientFeaturesAndBlogs initialBlog={initialBlog} />;
}

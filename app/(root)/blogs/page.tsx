import { getPublicBlogs } from "@/lib/actions/blog.actions";
import { BlogService } from "@/services/blog.service";
import { Metadata } from "next";
import ClientBlogs from "./client";
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const result = await BlogService.getBlogs();
  const blogs = result.data || [];

  // Take only the most recent or relevant blogs for metadata
  const recentBlogs = blogs.slice(0, 3);
  const titles = recentBlogs.map((blog) => blog.metaTitle).join(" | ");
  const descriptions = recentBlogs
    .map((blog) => blog.metaDescription)
    .join(". ")
    .replace(/\.\./g, "."); // Remove double periods
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

export default async function BlogsPage() {
  const initialBlog = await getPublicBlogs();
  return <ClientBlogs initialBlog={initialBlog} />;
}

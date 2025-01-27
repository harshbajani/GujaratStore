import { Metadata } from "next";
import { getAllBlogs } from "@/lib/actions/blog.actions";
import ClientFeaturesAndBlogs from "./client";
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const blogs = await getAllBlogs();

  const titles = blogs.map((blog) => blog.metaTitle).join(", ");
  const descriptions = blogs.map((blog) => blog.metaDescription).join(". ");

  // Create a consolidated keywords string from all blog posts
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
      images: blogs.length > 0 ? [blogs[0].imageId] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Our Blog - Latest Posts and Updates",
      description: descriptions.substring(0, 160),
      images: blogs.length > 0 ? [blogs[0].imageId] : [],
    },
  };
}

export default async function BlogPage() {
  const initialBlog = await getAllBlogs();
  return <ClientFeaturesAndBlogs initialBlog={initialBlog} />;
}

import { Metadata } from "next";
import { getAllBlogs } from "@/lib/actions/blog.actions";

export async function generateMetadata(): Promise<Metadata> {
  const blogs = await getAllBlogs();

  // Create a consolidated keywords string from all blog posts
  const keywords = blogs
    .map((blog) => blog.metaKeywords)
    .filter(Boolean)
    .join(", ");

  return {
    title: "Our Blog - Latest Posts and Updates",
    description:
      "Explore our latest blog posts about technology, innovation, and more.",
    keywords,
    openGraph: {
      title: "Our Blog - Latest Posts and Updates",
      description:
        "Explore our latest blog posts about technology, innovation, and more.",
      images: blogs.length > 0 ? [blogs[0].image] : [],
    },
  };
}

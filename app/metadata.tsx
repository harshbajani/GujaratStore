import { Metadata } from "next";
import { BlogService } from "@/services/blog.service";

export async function generateMetadata(): Promise<Metadata> {
  const result = await BlogService.getBlogs();
  const blogs = result.data || [];

  // Filter out any null/undefined values before processing
  const validBlogs = blogs.filter(
    (blog) => blog && blog.metaTitle && blog.metaDescription
  );

  const titles = validBlogs
    .map((blog) => blog.metaTitle)
    .filter(Boolean)
    .join(", ");

  const descriptions = validBlogs
    .map((blog) => blog.metaDescription)
    .filter(Boolean)
    .join(". ");

  // Create a consolidated keywords string from all blog posts
  const keywordsSet = new Set<string>();
  validBlogs.forEach((blog) => {
    if (blog.metaKeywords) {
      blog.metaKeywords
        .split(",")
        .map((keyword) => keyword.trim())
        .filter(Boolean)
        .forEach((keyword) => keywordsSet.add(keyword));
    }
  });
  const keywords = Array.from(keywordsSet).join(", ");

  // Get the first valid image for OpenGraph/Twitter cards
  const firstBlogWithImage = validBlogs.find((blog) => blog.imageId);
  const imageUrl = firstBlogWithImage
    ? `/api/files/${firstBlogWithImage.imageId}`
    : null;

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
      images: imageUrl
        ? [
            {
              url: imageUrl,
              width: 1200,
              height: 630,
              alt: "Latest Blog Posts",
            },
          ]
        : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Our Blog - Latest Posts and Updates",
      description: descriptions.substring(0, 160),
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

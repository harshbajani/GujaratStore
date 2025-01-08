"use server";

import { connectToDB } from "@/lib/mongodb";
import Blog from "@/lib/models/blog.model";
import { blogSchema } from "@/lib/validations";
import { MongoDBBlog, TransformedBlog } from "@/types";

// * blog creation
export async function createBlog(formData: FormData) {
  try {
    await connectToDB();

    // Validate the form data
    const validatedData = blogSchema.parse({
      imageId: formData.get("imageId"),
      user: formData.get("user"),
      date: formData.get("date"),
      heading: formData.get("heading"),
      description: formData.get("description"),
      category: formData.get("category"),
      metaTitle: formData.get("metaTitle"),
      metaDescription: formData.get("metaDescription"),
      metaKeywords: formData.get("metaKeywords"),
    });

    // Create the blog post
    const blog = await Blog.create(validatedData);

    return { success: true, blog };
  } catch (error) {
    console.error("Blog creation error:", error);
    throw new Error("Failed to create blog");
  }
}

// * get all blogs
export async function getAllBlogs() {
  try {
    await connectToDB();

    const blogs = await Blog.find({})
      .sort({ createdAt: -1 }) // Sort by newest first
      .lean() // Convert to plain JS objects
      .exec();

    // Transform the data to include image URLs
    const transformedBlogs = blogs.map((blog) => ({
      id: blog._id as string,
      heading: blog.heading,
      user: blog.user,
      date: blog.date,
      description: blog.description,
      category: blog.category,
      image: `/api/files/${blog.imageId}`, // Use the GridFS file endpoint
      metaTitle: blog.metaTitle,
      metaDescription: blog.metaDescription,
      metaKeywords: blog.metaKeywords,
    }));

    return transformedBlogs;
  } catch (error) {
    console.error("Error fetching blogs:", error);
    throw new Error("Failed to fetch blogs");
  }
}

// * get blog by id
export async function getBlogById(id: string): Promise<TransformedBlog | null> {
  try {
    await connectToDB();

    const blog = (await Blog.findById(id).lean().exec()) as MongoDBBlog | null;

    if (!blog) {
      return null;
    }

    // Transform the single blog document
    const transformedBlog = {
      id: blog._id.toString(),
      heading: blog.heading,
      user: blog.user,
      date: blog.date,
      description: blog.description,
      category: blog.category,
      image: `/api/files/${blog.imageId}`, // Use the GridFS file endpoint
      metaTitle: blog.metaTitle,
      metaDescription: blog.metaDescription,
      metaKeywords: blog.metaKeywords,
    };

    return transformedBlog;
  } catch (error) {
    console.error("Error fetching blog:", error);
    throw new Error("Failed to fetch blog");
  }
}

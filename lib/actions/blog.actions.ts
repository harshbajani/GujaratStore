"use server";

import { connectToDB } from "@/lib/mongodb";
import Blog from "@/lib/models/blog.model";
import { blogSchema } from "@/lib/validations";
import { IBlog, TransformedBlog } from "@/types";
import { Types } from "mongoose";
import { ObjectId } from "mongodb";

export async function createBlog(formData: FormData) {
  try {
    await connectToDB();

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

    const blog = await Blog.create(validatedData);
    return { success: true, blog };
  } catch (error) {
    console.error("Blog creation error:", error);
    throw new Error("Failed to create blog");
  }
}

export async function getAllBlogs() {
  try {
    await connectToDB();

    const blogs = await Blog.find({}).sort({ createdAt: -1 }).lean().exec();

    const transformedBlogs = await Promise.all(
      blogs.map(async (blog) => {
        const image = await getFileById(blog.imageId); // Fetch file using the new server action
        return {
          id: (blog._id as Types.ObjectId).toString(), // Ensure id is a string
          heading: blog.heading,
          user: blog.user,
          date: blog.date,
          description: blog.description,
          category: blog.category,
          imageId: image.buffer.toString("base64"), // Return the image as base64 for frontend use
          metaTitle: blog.metaTitle,
          metaDescription: blog.metaDescription,
          metaKeywords: blog.metaKeywords,
        };
      })
    );

    return transformedBlogs;
  } catch (error) {
    console.error("Error fetching blogs:", error);
    throw new Error("Failed to fetch blogs");
  }
}

export async function getBlogById(id: string): Promise<TransformedBlog | null> {
  try {
    await connectToDB();

    // Check if the ObjectId is valid
    if (!Types.ObjectId.isValid(id)) return null;

    // Fetch the blog post from the database
    const blog = (await Blog.findById(id)) as IBlog | null;

    // If the blog doesn't exist, return null
    if (!blog) return null;

    // Fetch the image using the getFileById function
    // const image = await getFileById(blog.imageId);
    // console.log(image);

    // Transform the blog data to include the image as base64
    const transformedBlog = {
      id: blog._id.toString(), // Ensure id is a string
      heading: blog.heading,
      user: blog.user,
      date: blog.date, // Convert date to string
      description: blog.description,
      category: blog.category,
      imageId: blog.imageId, // Return the image as base64 for frontend use
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

//* Update a blog post
export async function updateBlog(
  id: string,
  updateData: Partial<TransformedBlog>
) {
  try {
    // Find the existing blog
    const existingBlog = await Blog.findById(id);

    if (!existingBlog) {
      throw new Error("Blog not found");
    }

    // Retain the existing imageId if no new imageId is provided
    if (!updateData.imageId) {
      updateData.imageId = existingBlog.imageId;
    }

    const updatedBlog = await Blog.findByIdAndUpdate(id, updateData, {
      new: true,
      lean: true,
    });

    return { success: true, data: updatedBlog };
  } catch (error) {
    console.error(`Failed to update blog with id ${id}:`, error);
    return {
      success: false,
      error: "Failed to update blog",
    };
  }
}

export async function getFileById(id: string) {
  try {
    const { bucket } = await connectToDB();

    const fileId = new ObjectId(id);

    // Get file info
    const files = await bucket.find({ _id: fileId }).toArray();
    if (!files.length) {
      throw new Error("File not found");
    }

    const file = files[0];

    // Create download stream
    const downloadStream = bucket.openDownloadStream(fileId);

    // Convert stream to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of downloadStream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Return file details and buffer
    return {
      buffer,
      _id: file._id,
      contentType: file.contentType || "application/octet-stream",
      filename: file.filename,
    };
  } catch (error) {
    console.error("Error retrieving file:", error);
    throw new Error("Failed to retrieve file");
  }
}

//* Delete a blog post
export async function deleteBlog(id: string) {
  try {
    await connectToDB();
    const deletedBlog = await Blog.findByIdAndDelete(id).lean();
    if (!deletedBlog) {
      throw new Error("Blog not found");
    }
    return deletedBlog;
  } catch (error) {
    console.error(`Failed to delete blog with id ${id}:`, error);
    throw new Error("Failed to delete blog");
  }
}

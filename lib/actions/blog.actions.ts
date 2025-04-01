"use server";

import { connectToDB } from "@/lib/mongodb";
import Blog from "@/lib/models/blog.model";
import { blogSchema } from "@/lib/validations";
import { IBlog, TransformedBlog } from "@/types";
import { Types } from "mongoose";
import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { getCurrentVendor } from "./vendor.actions";

export async function createBlog(formData: FormData, vendorId: string) {
  try {
    // Create a plain object from FormData
    const blogData = {
      vendorId: vendorId,
      imageId: formData.get("imageId"),
      user: formData.get("user"),
      date: formData.get("date"),
      heading: formData.get("heading"),
      description: formData.get("description"),
      category: formData.get("category"),
      metaTitle: formData.get("metaTitle"),
      metaDescription: formData.get("metaDescription"),
      metaKeywords: formData.get("metaKeywords") || "",
    };

    // Validate the data
    const validationResult = blogSchema.safeParse(blogData);

    if (!validationResult.success) {
      console.error("Validation error:", validationResult.error);
      return {
        success: false,
        error: validationResult.error.errors[0].message,
      };
    }

    // Create new blog
    const blog = await Blog.create({
      ...validationResult.data,
      vendorId: vendorId, // Ensure vendorId is set correctly
    });

    revalidatePath("/vendor/blogs");

    return {
      success: true,
      data: transformBlog(blog),
    };
  } catch (error) {
    console.error("Blog creation error:", error);
    return {
      success: false,
      error: "Failed to create blog",
    };
  }
}

// Helper function to transform blog document
function transformBlog(blog: IBlog): TransformedBlog {
  return {
    id: blog._id.toString(),
    vendorId: blog.vendorId,
    imageId: blog.imageId,
    user: blog.user,
    date: blog.date,
    heading: blog.heading,
    description: blog.description,
    category: blog.category,
    metaTitle: blog.metaTitle,
    metaDescription: blog.metaDescription,
    metaKeywords: blog.metaKeywords,
  };
}

export async function getAllBlogs() {
  try {
    await connectToDB();

    // Get the current vendor first
    const vendorResponse = await getCurrentVendor();

    if (!vendorResponse.success) {
      throw new Error("Not authenticated as vendor");
    }

    const vendorId = vendorResponse.data?._id;

    // Fetch only blogs for current vendor
    const blogs = await Blog.find({ vendorId })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    const transformedBlogs = await Promise.all(
      blogs.map(async (blog) => {
        const image = await getFileById(blog.imageId);
        return {
          id: (blog._id as Types.ObjectId).toString(),
          vendorId: blog.vendorId,
          heading: blog.heading,
          user: blog.user,
          date: blog.date,
          description: blog.description,
          category: blog.category,
          imageId: image.buffer.toString("base64"),
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

// In your blog.actions.ts or a new public action file
export async function getPublicBlogs() {
  try {
    await connectToDB();
    // Fetch all blogs regardless of vendor
    const blogs = await Blog.find({})
      .sort({ createdAt: -1 })
      .lean<IBlog[]>() // Specify that the resulting documents are an array of IBlog
      .exec();

    const transformedBlogs = await Promise.all(
      blogs.map(async (blog) => {
        const typedBlog = blog as IBlog; // Cast to IBlog
        const image = await getFileById(typedBlog.imageId);
        return {
          id: typedBlog._id.toString(),
          vendorId: typedBlog.vendorId,
          heading: typedBlog.heading,
          user: typedBlog.user,
          date: typedBlog.date,
          description: typedBlog.description,
          category: typedBlog.category,
          imageId: image.buffer.toString("base64"),
          metaTitle: typedBlog.metaTitle,
          metaDescription: typedBlog.metaDescription,
          metaKeywords: typedBlog.metaKeywords,
        };
      })
    );

    return transformedBlogs;
  } catch (error) {
    console.error("Error fetching public blogs:", error);
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

    // Transform the blog data to include the image as base64
    const transformedBlog = {
      id: blog._id.toString(), // Ensure id is a string
      vendorId: blog.vendorId,
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
  vendorId: string,
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

    const updatedBlog = await Blog.findByIdAndUpdate(
      id,
      { ...updateData, vendorId },
      {
        new: true,
        lean: true,
      }
    );

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

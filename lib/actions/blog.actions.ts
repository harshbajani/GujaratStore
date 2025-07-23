"use server";

import { BlogService } from "@/services/blog.service";
import { revalidatePath } from "next/cache";
import { blogSchema } from "@/lib/validations";
import { IBlog } from "@/types";

export async function createBlog(formData: FormData, vendorId: string) {
  try {
    const blogData = {
      vendorId,
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

    const validationResult = blogSchema.safeParse(blogData);
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.errors[0].message,
      };
    }

    const result = await BlogService.createBlog(validationResult.data);
    if (result.success) {
      revalidatePath("/vendor/blogs");
    }

    return result;
  } catch (error) {
    console.error("Blog creation error:", error);
    return {
      success: false,
      error: "Failed to create blog",
    };
  }
}

export async function getAllBlogs(
  params: PaginationParams = {},
  vendorId?: string
): Promise<PaginatedResponse<TransformedBlog>> {
  try {
    const result = await BlogService.getBlogs(params, vendorId);
    return result;
  } catch (error) {
    console.error("Error fetching blogs:", error);
    return {
      success: false,
      error: "Failed to fetch blogs",
    };
  }
}

export async function getAllBlogsLegacy(vendorId?: string) {
  try {
    const result = await BlogService.getBlogsLegacy(vendorId);
    return result;
  } catch (error) {
    console.error("Error fetching blogs:", error);
    throw new Error("Failed to fetch blogs");
  }
}

export async function getPublicBlogs() {
  try {
    const result = await BlogService.getBlogs();
    return result;
  } catch (error) {
    console.error("Error fetching blogs:", error);
    throw new Error("Failed to fetch blogs");
  }
}

export async function getBlogById(id: string) {
  try {
    const result = await BlogService.getBlogById(id);
    return result.data;
  } catch (error) {
    console.error("Error fetching blog:", error);
    throw new Error("Failed to fetch blog");
  }
}

export async function updateBlog(
  id: string,
  vendorId: string,
  updateData: Partial<IBlog>
) {
  try {
    const result = await BlogService.updateBlog(id, vendorId, updateData);
    if (result.success) {
      revalidatePath("/vendor/blogs");
    }
    return result;
  } catch (error) {
    console.error("Error updating blog:", error);
    return {
      success: false,
      error: "Failed to update blog",
    };
  }
}

export async function deleteBlog(id: string) {
  try {
    const result = await BlogService.deleteBlog(id);
    if (result.success) {
      revalidatePath("/vendor/blogs");
    }
    return result;
  } catch (error) {
    console.error("Error deleting blog:", error);
    throw new Error("Failed to delete blog");
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { CacheService } from "./cache.service";
import Blog from "@/lib/models/blog.model";
import { connectToDB } from "@/lib/mongodb";
import { IBlog } from "@/types";
import { Types } from "mongoose";

const CACHE_KEYS = {
  BLOG_DETAILS: "blog:details:",
  BLOG_LIST: "blog:list:",
  VENDOR_BLOGS: "blog:vendor:",
} as const;

const CACHE_TTL = 300; // 5 minutes

export class BlogService {
  static async createBlog(
    blogData: Partial<IBlog>
  ): Promise<ActionResponse<TransformedBlog>> {
    try {
      await connectToDB();

      const blog = await Blog.create(blogData);
      await this.invalidateBlogCaches();

      return {
        success: true,
        message: "Blog created successfully",
        data: this.transformBlog(blog),
      };
    } catch (error) {
      console.error("Blog creation error:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to create blog",
      };
    }
  }

  static async getBlogs(
    params: PaginationParams = {},
    vendorId?: string
  ): Promise<PaginatedResponse<TransformedBlog>> {
    try {
      await connectToDB();

      const {
        page = 1,
        limit = 10,
        search = "",
        sortBy = "createdAt",
        sortOrder = "desc",
      } = params;

      // Build query
      const query: any = vendorId ? { vendorId } : {};

      // Add search functionality
      if (search) {
        query.$or = [
          { heading: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { category: { $regex: search, $options: "i" } },
          { user: { $regex: search, $options: "i" } },
        ];
      }

      // Build sort object
      const sortObject: any = {};
      sortObject[sortBy] = sortOrder === "asc" ? 1 : -1;

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Get total count for pagination info
      const totalItems = await Blog.countDocuments(query);
      const totalPages = Math.ceil(totalItems / limit);

      // Fetch paginated data
      const blogs = await Blog.find(query)
        .sort(sortObject)
        .skip(skip)
        .limit(limit)
        .lean<IBlog[]>()
        .exec();

      const transformedBlogs = blogs.map(this.transformBlog);

      // Build pagination info
      const pagination: PaginationInfo = {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      };

      return {
        success: true,
        data: transformedBlogs,
        pagination,
      };
    } catch (error) {
      console.error("Get paginated blogs error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch blogs",
      };
    }
  }

  static async getBlogsLegacy(
    vendorId?: string
  ): Promise<ActionResponse<TransformedBlog[]>> {
    try {
      await connectToDB();
      const cacheKey = `${CACHE_KEYS.BLOG_LIST}${vendorId || "public"}`;
      const cached = await CacheService.get<TransformedBlog[]>(cacheKey);

      if (cached) {
        return {
          success: true,
          message: "Blogs retrieved from cache",
          data: cached,
        };
      }

      const query = vendorId ? { vendorId } : {};
      const blogs = await Blog.find(query)
        .sort({ createdAt: -1 })
        .lean<IBlog[]>()
        .exec();

      const transformedBlogs = blogs.map(this.transformBlog);
      await CacheService.set(cacheKey, transformedBlogs, CACHE_TTL);

      return {
        success: true,
        message: "Blogs retrieved successfully",
        data: transformedBlogs,
      };
    } catch (error) {
      console.error("Get blogs error:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to fetch blogs",
      };
    }
  }

  static async getBlogById(
    id: string
  ): Promise<ActionResponse<TransformedBlog>> {
    try {
      await connectToDB();
      const cacheKey = `${CACHE_KEYS.BLOG_DETAILS}${id}`;
      const cached = await CacheService.get<TransformedBlog>(cacheKey);

      if (cached) {
        return {
          success: true,
          message: "Blog retrieved from cache",
          data: cached,
        };
      }

      if (!Types.ObjectId.isValid(id)) {
        return { success: false, message: "Invalid blog ID" };
      }

      const blog = await Blog.findById(id).lean<IBlog>();
      if (!blog) {
        return { success: false, message: "Blog not found" };
      }

      const transformedBlog = this.transformBlog(blog);
      await CacheService.set(cacheKey, transformedBlog, CACHE_TTL);

      return {
        success: true,
        message: "Blog retrieved successfully",
        data: transformedBlog,
      };
    } catch (error) {
      console.error("Get blog error:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to fetch blog",
      };
    }
  }

  static async updateBlog(
    id: string,
    vendorId: string,
    updateData: Partial<TransformedBlog>
  ): Promise<ActionResponse<TransformedBlog>> {
    try {
      await connectToDB();

      if (!Types.ObjectId.isValid(id)) {
        return { success: false, message: "Invalid blog ID" };
      }

      const blog = await Blog.findOneAndUpdate(
        { _id: id, vendorId },
        updateData,
        { new: true }
      ).lean<IBlog>();

      if (!blog) {
        return { success: false, message: "Blog not found" };
      }

      await this.invalidateBlogCaches();

      return {
        success: true,
        message: "Blog updated successfully",
        data: this.transformBlog(blog),
      };
    } catch (error) {
      console.error("Update blog error:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to update blog",
      };
    }
  }

  static async deleteBlog(id: string): Promise<ActionResponse> {
    try {
      await connectToDB();

      if (!Types.ObjectId.isValid(id)) {
        return { success: false, message: "Invalid blog ID" };
      }

      const blog = await Blog.findOneAndDelete({ _id: id });
      if (!blog) {
        return { success: false, message: "Blog not found" };
      }

      await this.invalidateBlogCaches();

      return {
        success: true,
        message: "Blog deleted successfully",
      };
    } catch (error) {
      console.error("Delete blog error:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to delete blog",
      };
    }
  }

  private static transformBlog(blog: IBlog): TransformedBlog {
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

  private static async invalidateBlogCaches(): Promise<void> {
    try {
      const patterns = Object.values(CACHE_KEYS).map((key) => `${key}*`);
      for (const pattern of patterns) {
        const keys = await CacheService.keys(pattern);
        for (const key of keys) {
          await CacheService.delete(key);
        }
      }
    } catch (error) {
      console.error("Cache invalidation error:", error);
    }
  }
}

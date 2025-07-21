/* eslint-disable @typescript-eslint/no-explicit-any */
import { connectToDB } from "@/lib/mongodb";
import ParentCategory from "@/lib/models/parentCategory.model";
import { CacheService } from "./cache.service";

export class ParentCategoryService {
  private static CACHE_TTL = 300; // 5 minutes

  private static async getCacheKey(key: string): Promise<string> {
    return `parent_categories:${key}`;
  }

  static async createParentCategory(
    data: Pick<IParentCategory, "name" | "isActive">
  ): Promise<ActionResponse<IParentCategory>> {
    try {
      await connectToDB();

      const existingCategory = await ParentCategory.findOne({
        name: data.name,
      }).lean();

      if (existingCategory) {
        return {
          success: false,
          message: "Parent Category with this name already exists",
        };
      }

      const category = await ParentCategory.create(data);
      await this.invalidateCache();
      return {
        success: true,
        message: "Parent category created successfully",
        data: this.transformParentCategory(category),
      };
    } catch (error) {
      console.error("Create parent category error:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to create parent category",
      };
    }
  }

  // Keep the original method for backward compatibility
  static async getAllParentCategories(): Promise<
    ActionResponse<IParentCategory[]>
  > {
    try {
      const cacheKey = await this.getCacheKey("all");
      const cached = await CacheService.get<IParentCategory[]>(cacheKey);

      if (cached) {
        return {
          success: true,
          data: cached,
          message: "Parent categories retrieved from cache",
        };
      }

      await connectToDB();
      const categories = await ParentCategory.find().sort({ name: 1 }).lean();

      const serializedCategories = categories.map(this.transformParentCategory);
      await CacheService.set(cacheKey, serializedCategories, this.CACHE_TTL);

      return {
        success: true,
        message: "Parent categories retrieved successfully",
        data: serializedCategories,
      };
    } catch (error) {
      console.error("Get parent categories error:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch parent categories",
      };
    }
  }

  // New method with server-side pagination, filtering, and sorting
  static async getParentCategoriesPaginated(
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<IParentCategory>> {
    try {
      await connectToDB();

      const {
        page = 1,
        limit = 10,
        search = "",
        sortBy = "name",
        sortOrder = "asc",
      } = params;

      // Build search query
      const searchQuery: any = {};
      if (search && search.trim()) {
        searchQuery.$or = [{ name: { $regex: search.trim(), $options: "i" } }];
      }

      // Build sort object
      const sortObj: any = {};
      if (sortBy) {
        sortObj[sortBy] = sortOrder === "desc" ? -1 : 1;
      } else {
        sortObj.name = 1; // Default sort by name ascending
      }

      // Calculate pagination values
      const skip = (page - 1) * limit;

      // Execute queries
      const [categories, totalCount] = await Promise.all([
        ParentCategory.find(searchQuery)
          .sort(sortObj)
          .skip(skip)
          .limit(limit)
          .lean(),
        ParentCategory.countDocuments(searchQuery),
      ]);

      // Transform categories
      const transformedCategories = categories.map(
        this.transformParentCategory
      );

      // Calculate pagination info
      const totalPages = Math.ceil(totalCount / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      const pagination: PaginationInfo = {
        currentPage: page,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limit,
        hasNext,
        hasPrev,
      };

      return {
        success: true,
        data: transformedCategories,
        pagination,
      };
    } catch (error) {
      console.error("Get paginated parent categories error:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch parent categories",
      };
    }
  }

  static async getParentCategoryById(
    id: string
  ): Promise<ActionResponse<IParentCategory>> {
    try {
      await connectToDB();
      const category = await ParentCategory.findById(id).lean();

      if (!category) {
        return {
          success: false,
          message: "Parent category not found",
        };
      }

      return {
        success: true,
        message: "Parent category retrieved successfully",
        data: this.transformParentCategory(category),
      };
    } catch (error) {
      console.error("Get parent category error:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch parent category",
      };
    }
  }

  static async updateParentCategory(
    id: string,
    data: Partial<IParentCategory>
  ): Promise<ActionResponse<IParentCategory>> {
    try {
      await connectToDB();

      if (data.name) {
        const existing = await ParentCategory.findOne({
          name: data.name,
          _id: { $ne: id },
        }).lean();

        if (existing) {
          return {
            success: false,
            message: "Parent Category with this name already exists",
          };
        }
      }

      const updated = await ParentCategory.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true }
      ).lean();

      if (!updated) {
        return {
          success: false,
          message: "Parent category not found",
        };
      }

      await this.invalidateCache();
      return {
        success: true,
        message: "Parent category updated successfully",
        data: this.transformParentCategory(updated),
      };
    } catch (error) {
      console.error("Update parent category error:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to update parent category",
      };
    }
  }

  static async deleteParentCategory(id: string): Promise<ActionResponse<void>> {
    try {
      await connectToDB();
      const result = await ParentCategory.findByIdAndDelete(id);

      if (!result) {
        return {
          success: false,
          message: "Parent category not found",
        };
      }

      await this.invalidateCache();
      return {
        success: true,
        message: "Parent category deleted successfully",
      };
    } catch (error) {
      console.error("Delete parent category error:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to delete parent category",
      };
    }
  }

  private static transformParentCategory(category: any): IParentCategory {
    return {
      id: category._id.toString(),
      _id: category._id.toString(),
      name: category.name,
      isActive: category.isActive,
    };
  }

  private static async invalidateCache(): Promise<void> {
    try {
      const cacheKey = await this.getCacheKey("all");
      await CacheService.delete(cacheKey);
    } catch (error) {
      console.error("Cache invalidation error:", error);
    }
  }
}

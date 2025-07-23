/* eslint-disable @typescript-eslint/no-explicit-any */
import { connectToDB } from "@/lib/mongodb";
import PrimaryCategory from "@/lib/models/primaryCategory.model";
import ParentCategory from "@/lib/models/parentCategory.model";
import { CacheService } from "./cache.service";

export class PrimaryCategoryService {
  private static CACHE_TTL = 300; // 5 minutes

  private static async getCacheKey(key: string): Promise<string> {
    return `primary_categories:${key}`;
  }

  static async createPrimaryCategory(
    data: Omit<IPrimaryCategory, "_id">
  ): Promise<ActionResponse<IPrimaryCategory>> {
    try {
      await connectToDB();

      const parentCategoryExists = await ParentCategory.findById(
        data.parentCategory
      );
      if (!parentCategoryExists) {
        return {
          success: false,
          message: "Parent category not found",
        };
      }

      const primaryCategory = await PrimaryCategory.create(data);
      const populated = await this.populatePrimaryCategory(primaryCategory);
      await this.invalidateCache();

      return {
        success: true,
        message: "Primary category created successfully",
        data: this.transformPrimaryCategory(populated),
      };
    } catch (error) {
      console.error("Create primary category error:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to create primary category",
      };
    }
  }

  // Keep the original method for backward compatibility
  static async getAllPrimaryCategories(): Promise<
    ActionResponse<IPrimaryCategory[]>
  > {
    try {
      const cacheKey = await this.getCacheKey("all");
      const cached = await CacheService.get<IPrimaryCategory[]>(cacheKey);

      if (cached) {
        return {
          success: true,
          data: cached,
          message: "Primary categories retrieved from cache",
        };
      }

      await connectToDB();
      const categories = await PrimaryCategory.find()
        .populate("parentCategory")
        .sort({ name: 1 })
        .lean();

      const serializedCategories = categories.map(
        this.transformPrimaryCategory
      );
      await CacheService.set(cacheKey, serializedCategories, this.CACHE_TTL);

      return {
        success: true,
        message: "Primary categories retrieved successfully",
        data: serializedCategories,
      };
    } catch (error) {
      console.error("Get primary categories error:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch primary categories",
      };
    }
  }

  // New method with server-side pagination, filtering, and sorting
  static async getPrimaryCategoriesPaginated(
    params: PaginationParams & { parentCategoryId?: string } = {}
  ): Promise<PaginatedResponse<IPrimaryCategory>> {
    try {
      await connectToDB();

      const {
        page = 1,
        limit = 10,
        search = "",
        sortBy = "name",
        sortOrder = "asc",
        parentCategoryId,
      } = params;

      // Generate cache key based on parameters
      const cacheKey = await this.getCacheKey(
        `paginated:${
          parentCategoryId || "all"
        }:${page}:${limit}:${search}:${sortBy}:${sortOrder}`
      );

      // Check cache first
      const cached = await CacheService.get<
        PaginatedResponse<IPrimaryCategory>
      >(cacheKey);
      if (cached) {
        return cached;
      }

      // Existing query logic...
      const searchQuery: any = {};
      if (parentCategoryId) {
        searchQuery.parentCategory = parentCategoryId;
      }
      if (search && search.trim()) {
        const searchRegex = { $regex: search.trim(), $options: "i" };
        searchQuery.$or = [
          { name: searchRegex },
          { description: searchRegex },
          { metaTitle: searchRegex },
          { metaDescription: searchRegex },
        ];
      }

      const sortObj: any = {};
      if (sortBy === "parentCategory.name") {
        sortObj["parentCategory.name"] = sortOrder === "desc" ? -1 : 1;
      } else {
        sortObj[sortBy] = sortOrder === "desc" ? -1 : 1;
      }

      const skip = (page - 1) * limit;
      const pipeline = [
        { $match: searchQuery },
        {
          $lookup: {
            from: "parentcategories",
            localField: "parentCategory",
            foreignField: "_id",
            as: "parentCategory",
          },
        },
        { $unwind: "$parentCategory" },
        ...(search && search.trim()
          ? [
              {
                $match: {
                  $or: [
                    { name: { $regex: search.trim(), $options: "i" } },
                    { description: { $regex: search.trim(), $options: "i" } },
                    { metaTitle: { $regex: search.trim(), $options: "i" } },
                    {
                      metaDescription: { $regex: search.trim(), $options: "i" },
                    },
                    {
                      "parentCategory.name": {
                        $regex: search.trim(),
                        $options: "i",
                      },
                    },
                  ],
                },
              },
            ]
          : []),
        { $sort: sortObj },
        {
          $facet: {
            data: [{ $skip: skip }, { $limit: limit }],
            count: [{ $count: "total" }],
          },
        },
      ];

      const [result] = await PrimaryCategory.aggregate(pipeline);
      const categories = result.data || [];
      const totalCount = result.count[0]?.total || 0;

      const transformedCategories = categories.map(
        this.transformPrimaryCategory
      );
      const totalPages = Math.ceil(totalCount / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      const response: PaginatedResponse<IPrimaryCategory> = {
        success: true,
        data: transformedCategories,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: totalCount,
          itemsPerPage: limit,
          hasNext,
          hasPrev,
        },
      };

      // Set cache
      await CacheService.set(cacheKey, response, this.CACHE_TTL);
      return response;
    } catch (error) {
      console.error("Get paginated primary categories error:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch primary categories",
      };
    }
  }

  static async getPrimaryCategoryById(
    id: string
  ): Promise<ActionResponse<IPrimaryCategory>> {
    try {
      await connectToDB();
      const category = await PrimaryCategory.findById(id)
        .populate("parentCategory")
        .lean();

      if (!category) {
        return {
          success: false,
          message: "Primary category not found",
        };
      }

      return {
        success: true,
        message: "Primary category retrieved successfully",
        data: this.transformPrimaryCategory(category),
      };
    } catch (error) {
      console.error("Get primary category error:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch primary category",
      };
    }
  }

  static async updatePrimaryCategory(
    id: string,
    data: Partial<IPrimaryCategory>
  ): Promise<ActionResponse<IPrimaryCategory>> {
    try {
      await connectToDB();

      if (data.parentCategory) {
        const parentCategoryExists = await ParentCategory.findById(
          data.parentCategory
        );
        if (!parentCategoryExists) {
          return {
            success: false,
            message: "Parent category not found",
          };
        }
      }

      const updated = await PrimaryCategory.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true }
      ).populate("parentCategory");

      if (!updated) {
        return {
          success: false,
          message: "Primary category not found",
        };
      }

      await this.invalidateCache();
      return {
        success: true,
        message: "Primary category updated successfully",
        data: this.transformPrimaryCategory(updated),
      };
    } catch (error) {
      console.error("Update primary category error:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to update primary category",
      };
    }
  }

  static async deletePrimaryCategory(
    id: string
  ): Promise<ActionResponse<void>> {
    try {
      await connectToDB();
      const result = await PrimaryCategory.findByIdAndDelete(id);

      if (!result) {
        return {
          success: false,
          message: "Primary category not found",
        };
      }

      await this.invalidateCache();
      return {
        success: true,
        message: "Primary category deleted successfully",
      };
    } catch (error) {
      console.error("Delete primary category error:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to delete primary category",
      };
    }
  }

  private static async populatePrimaryCategory(category: any) {
    return await PrimaryCategory.populate(category, {
      path: "parentCategory",
      select: "name isActive",
    });
  }

  private static transformPrimaryCategory(category: any): IPrimaryCategory {
    return {
      _id: category._id.toString(),
      name: category.name,
      parentCategory: {
        _id: category.parentCategory._id.toString(),
        name: category.parentCategory.name,
        isActive: category.parentCategory.isActive,
      },
      description: category.description || "",
      metaTitle: category.metaTitle || "",
      metaKeywords: category.metaKeywords || [],
      metaDescription: category.metaDescription || "",
      isActive: category.isActive,
    };
  }

  private static async invalidateCache(): Promise<void> {
    try {
      const keys = await CacheService.keys("primary_categories:*");
      await Promise.all(keys.map((key) => CacheService.delete(key)));
    } catch (error) {
      console.error("Cache invalidation error:", error);
    }
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { connectToDB } from "@/lib/mongodb";
import SecondaryCategory from "@/lib/models/secondaryCategory.model";
import ParentCategory from "@/lib/models/parentCategory.model";
import PrimaryCategory from "@/lib/models/primaryCategory.model";
import Attributes from "@/lib/models/attribute.model";
import { CacheService } from "./cache.service";

export class SecondaryCategoryService {
  private static CACHE_TTL = 300; // 5 minutes

  private static async getCacheKey(key: string): Promise<string> {
    return `secondary_categories:${key}`;
  }

  static async createSecondaryCategory(
    data: Omit<ISecondaryCategory, "id">
  ): Promise<ActionResponse<ISecondaryCategory>> {
    try {
      await connectToDB();

      const [parentCategoryExists, primaryCategoryExists, attributesExist] =
        await Promise.all([
          ParentCategory.findById(data.parentCategory),
          PrimaryCategory.findById(data.primaryCategory),
          Attributes.find({ _id: { $in: data.attributes } }),
        ]);

      if (!parentCategoryExists) {
        return { success: false, message: "Parent category not found" };
      }

      if (!primaryCategoryExists) {
        return { success: false, message: "Primary category not found" };
      }

      if (attributesExist.length !== data.attributes.length) {
        return { success: false, message: "One or more attributes not found" };
      }

      const secondaryCategory = await SecondaryCategory.create(data);
      const populated = await this.populateSecondaryCategory(secondaryCategory);
      await this.invalidateCache();

      return {
        success: true,
        message: "Secondary category created successfully",
        data: this.transformSecondaryCategory(populated),
      };
    } catch (error) {
      console.error("Create secondary category error:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to create secondary category",
      };
    }
  }

  // Keep the original method for backward compatibility
  static async getAllSecondaryCategories(): Promise<
    ActionResponse<SecondaryCategoryWithPopulatedFields[]>
  > {
    try {
      const cacheKey = await this.getCacheKey("all");
      const cached = await CacheService.get<
        SecondaryCategoryWithPopulatedFields[]
      >(cacheKey);

      if (cached) {
        return {
          success: true,
          data: cached,
          message: "Secondary categories retrieved from cache",
        };
      }

      await connectToDB();

      const categories = await SecondaryCategory.find()
        .populate("parentCategory", "name isActive")
        .populate("primaryCategory", "name isActive")
        .populate("attributes", "name isActive") // This ensures we get the full attribute objects
        .sort({ name: 1 })
        .lean();

      const serializedCategories = categories.map(
        this.transformSecondaryCategory
      );
      await CacheService.set(cacheKey, serializedCategories, this.CACHE_TTL);

      return {
        success: true,
        message: "Secondary categories retrieved successfully",
        data: serializedCategories,
      };
    } catch (error) {
      console.error("Get secondary categories error:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch secondary categories",
      };
    }
  }

  // New method with server-side pagination, filtering, and sorting
  static async getSecondaryCategoriesPaginated(
    params: PaginationParams & {
      parentCategoryId?: string;
      primaryCategoryId?: string;
    } = {}
  ): Promise<PaginatedResponse<SecondaryCategoryWithPopulatedFields>> {
    try {
      await connectToDB();

      const {
        page = 1,
        limit = 10,
        search = "",
        sortBy = "name",
        sortOrder = "asc",
        parentCategoryId,
        primaryCategoryId,
      } = params;

      // Generate cache key based on parameters
      const cacheKey = await this.getCacheKey(
        `paginated:${parentCategoryId || "all"}:${
          primaryCategoryId || "all"
        }:${page}:${limit}:${search}:${sortBy}:${sortOrder}`
      );

      // Check cache first
      const cached = await CacheService.get<
        PaginatedResponse<SecondaryCategoryWithPopulatedFields>
      >(cacheKey);
      if (cached) {
        return cached;
      }

      // Build search query
      const searchQuery: any = {};
      if (parentCategoryId) {
        searchQuery.parentCategory = parentCategoryId;
      }
      if (primaryCategoryId) {
        searchQuery.primaryCategory = primaryCategoryId;
      }

      // Build sort object
      const sortObj: any = {};
      if (sortBy === "parentCategory.name") {
        sortObj["parentCategory.name"] = sortOrder === "desc" ? -1 : 1;
      } else if (sortBy === "primaryCategory.name") {
        sortObj["primaryCategory.name"] = sortOrder === "desc" ? -1 : 1;
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
        {
          $lookup: {
            from: "primarycategories",
            localField: "primaryCategory",
            foreignField: "_id",
            as: "primaryCategory",
          },
        },
        { $unwind: "$primaryCategory" },
        {
          $lookup: {
            from: "attributes",
            localField: "attributes",
            foreignField: "_id",
            as: "attributes",
          },
        },
        // Apply search filter after population
        ...(search && search.trim()
          ? [
              {
                $match: {
                  $or: [
                    { name: { $regex: search.trim(), $options: "i" } },
                    { description: { $regex: search.trim(), $options: "i" } },
                    {
                      "parentCategory.name": {
                        $regex: search.trim(),
                        $options: "i",
                      },
                    },
                    {
                      "primaryCategory.name": {
                        $regex: search.trim(),
                        $options: "i",
                      },
                    },
                    {
                      "attributes.name": {
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

      const [result] = await SecondaryCategory.aggregate(pipeline);
      const categories = result.data || [];
      const totalCount = result.count[0]?.total || 0;

      const transformedCategories = categories.map(
        this.transformSecondaryCategory
      );
      const totalPages = Math.ceil(totalCount / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      const response: PaginatedResponse<SecondaryCategoryWithPopulatedFields> =
        {
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
      console.error("Get paginated secondary categories error:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch secondary categories",
      };
    }
  }

  static async getSecondaryCategoryById(
    id: string
  ): Promise<ActionResponse<ISecondaryCategory>> {
    try {
      await connectToDB();

      const category = await SecondaryCategory.findById(id)
        .populate("parentCategory", "name isActive")
        .populate("primaryCategory", "name isActive")
        .populate("attributes", "name isActive")
        .lean();

      if (!category) {
        return { success: false, message: "Secondary category not found" };
      }

      return {
        success: true,
        message: "Secondary category retrieved successfully",
        data: this.transformSecondaryCategory(category),
      };
    } catch (error) {
      console.error("Get secondary category error:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch secondary category",
      };
    }
  }

  static async updateSecondaryCategory(
    id: string,
    data: Partial<ISecondaryCategory>
  ): Promise<ActionResponse<ISecondaryCategory>> {
    try {
      await connectToDB();

      if (data.parentCategory) {
        const parentCategoryExists = await ParentCategory.findById(
          data.parentCategory
        );
        if (!parentCategoryExists) {
          return { success: false, message: "Parent category not found" };
        }
      }

      if (data.primaryCategory) {
        const primaryCategoryExists = await PrimaryCategory.findById(
          data.primaryCategory
        );
        if (!primaryCategoryExists) {
          return { success: false, message: "Primary category not found" };
        }
      }

      if (data.attributes) {
        const attributesExist = await Attributes.find({
          _id: { $in: data.attributes },
        });
        if (attributesExist.length !== data.attributes.length) {
          return {
            success: false,
            message: "One or more attributes not found",
          };
        }
      }

      const updated = await SecondaryCategory.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true }
      )
        .populate("parentCategory", "name isActive")
        .populate("primaryCategory", "name isActive")
        .populate("attributes", "name isActive")
        .lean();

      if (!updated) {
        return { success: false, message: "Secondary category not found" };
      }

      await this.invalidateCache();
      return {
        success: true,
        message: "Secondary category updated successfully",
        data: this.transformSecondaryCategory(updated),
      };
    } catch (error) {
      console.error("Update secondary category error:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to update secondary category",
      };
    }
  }

  static async deleteSecondaryCategory(
    id: string
  ): Promise<ActionResponse<void>> {
    try {
      await connectToDB();

      const result = await SecondaryCategory.findByIdAndDelete(id);
      if (!result) {
        return { success: false, message: "Secondary category not found" };
      }

      await this.invalidateCache();
      return {
        success: true,
        message: "Secondary category deleted successfully",
      };
    } catch (error) {
      console.error("Delete secondary category error:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to delete secondary category",
      };
    }
  }

  private static async populateSecondaryCategory(category: any) {
    return await SecondaryCategory.populate(category, [
      { path: "parentCategory", select: "name isActive" },
      { path: "primaryCategory", select: "name isActive" },
      { path: "attributes", select: "name isActive" },
    ]);
  }

  private static transformSecondaryCategory(
    category: any
  ): SecondaryCategoryWithPopulatedFields {
    return {
      id: category._id.toString(),
      _id: category._id.toString(),
      name: category.name,
      parentCategory: {
        _id: category.parentCategory._id.toString(),
        name: category.parentCategory.name,
        isActive: category.parentCategory.isActive,
      },
      primaryCategory: {
        _id: category.primaryCategory._id.toString(),
        name: category.primaryCategory.name,
        isActive: category.primaryCategory.isActive,
      },
      attributes: category.attributes.map((attr: any) => ({
        _id: attr._id.toString(),
        name: attr.name,
        isActive: attr.isActive,
      })),
      description: category.description || "",
      isActive: category.isActive,
    };
  }

  private static async invalidateCache(): Promise<void> {
    try {
      const keys = await CacheService.keys("secondary_categories:*");
      await Promise.all(keys.map((key) => CacheService.delete(key)));
    } catch (error) {
      console.error("Cache invalidation error:", error);
    }
  }
}

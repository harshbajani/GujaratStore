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

  static async getAllSecondaryCategories(): Promise<ActionResponse<SecondaryCategoryWithPopulatedFields[]>> {
    try {
      const cacheKey = await this.getCacheKey("all");
      const cached = await CacheService.get<SecondaryCategoryWithPopulatedFields[]>(cacheKey);

      if (cached) {
        return { success: true, data: cached, message: "Secondary categories retrieved from cache" };
      }

      await connectToDB();

      const categories = await SecondaryCategory.find()
        .populate("parentCategory", "name isActive")
        .populate("primaryCategory", "name isActive")
        .populate("attributes", "name isActive") // This ensures we get the full attribute objects
        .sort({ name: 1 })
        .lean();

      const serializedCategories = categories.map(this.transformSecondaryCategory);
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

  private static transformSecondaryCategory(category: any): SecondaryCategoryWithPopulatedFields {
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
      const cacheKey = await this.getCacheKey("all");
      await CacheService.delete(cacheKey);
    } catch (error) {
      console.error("Cache invalidation error:", error);
    }
  }
}

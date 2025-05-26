/* eslint-disable @typescript-eslint/no-explicit-any */
import { connectToDB } from "@/lib/mongodb";
import PrimaryCategory from "@/lib/models/primaryCategory.model";
import ParentCategory from "@/lib/models/parentCategory.model";

export class PrimaryCategoryService {
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

  static async getAllPrimaryCategories(): Promise<
    ActionResponse<IPrimaryCategory[]>
  > {
    try {
      await connectToDB();
      const categories = await PrimaryCategory.find()
        .populate("parentCategory")
        .sort({ name: 1 })
        .lean();

      return {
        success: true,
        message: "Primary categories retrieved successfully",
        data: categories.map(this.transformPrimaryCategory),
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
}

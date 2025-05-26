/* eslint-disable @typescript-eslint/no-explicit-any */
import { connectToDB } from "@/lib/mongodb";
import ParentCategory from "@/lib/models/parentCategory.model";

export class ParentCategoryService {
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

  static async getAllParentCategories(): Promise<
    ActionResponse<IParentCategory[]>
  > {
    try {
      await connectToDB();
      const categories = await ParentCategory.find().sort({ name: 1 }).lean();

      return {
        success: true,
        message: "Parent categories retrieved successfully",
        data: categories.map(this.transformParentCategory),
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
}

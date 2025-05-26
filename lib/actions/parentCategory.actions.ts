"use server";

import { ParentCategoryService } from "@/services/parentCategory.service";
import { revalidatePath } from "next/cache";
import { parentCategorySchema } from "../validations";

export type ParentCategoryResponse = {
  success: boolean;
  data?: IParentCategory | IParentCategory[] | null;
  error?: string;
};

export async function createParentCategory(
  name: string,
  isActive: boolean
): Promise<ParentCategoryResponse> {
  try {
    const validation = parentCategorySchema.safeParse({ name, isActive });

    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors[0].message,
      };
    }

    const result = await ParentCategoryService.createParentCategory({
      name,
      isActive,
    });

    if (result.success) {
      revalidatePath("/admin/category/parentCategory");
    }

    return {
      success: result.success,
      data: null,
      error: result.message,
    };
  } catch (error) {
    console.error("Create parent category error:", error);
    return {
      success: false,
      error: "Failed to create parent category",
    };
  }
}

export async function getAllParentCategory(): Promise<ParentCategoryResponse> {
  try {
    const result = await ParentCategoryService.getAllParentCategories();
    return {
      success: result.success,
      data: result.data,
      error: result.message,
    };
  } catch (error) {
    console.error("Get parent categories error:", error);
    return {
      success: false,
      error: "Failed to fetch parent categories",
    };
  }
}

export async function getParentCategoryById(
  id: string
): Promise<ParentCategoryResponse> {
  try {
    const result = await ParentCategoryService.getParentCategoryById(id);
    return {
      success: result.success,
      data: result.data,
      error: result.message,
    };
  } catch (error) {
    console.error("Get parent category error:", error);
    return {
      success: false,
      error: "Failed to fetch parent category",
    };
  }
}

export async function updateParentCategory(
  id: string,
  data: { name: string; isActive: boolean }
): Promise<ParentCategoryResponse> {
  try {
    const result = await ParentCategoryService.updateParentCategory(id, data);

    if (result.success) {
      revalidatePath("/admin/category/parentCategory");
    }

    return {
      success: result.success,
      data: result.data,
      error: result.message,
    };
  } catch (error) {
    console.error("Update parent category error:", error);
    return {
      success: false,
      error: "Failed to update parent category",
    };
  }
}

export async function deleteParentCategory(
  id: string
): Promise<ParentCategoryResponse> {
  try {
    const result = await ParentCategoryService.deleteParentCategory(id);

    if (result.success) {
      revalidatePath("/admin/category/parentCategory");
    }

    return {
      success: result.success,
      data: result.data!,
      error: result.message,
    };
  } catch (error) {
    console.error("Delete parent category error:", error);
    return {
      success: false,
      error: "Failed to delete parent category",
    };
  }
}

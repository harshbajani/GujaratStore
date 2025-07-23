"use server";

import { PrimaryCategoryService } from "@/services/primaryCategory.service";
import { primaryCategorySchema } from "../validations";
import { revalidatePath } from "next/cache";

export type PrimaryCategoryResponse = {
  success: boolean;
  data?: IPrimaryCategory | IPrimaryCategory[] | null;
  error?: string;
};

export async function createPrimaryCategory(
  data: IPrimaryCategory
): Promise<PrimaryCategoryResponse> {
  try {
    const validatedData = primaryCategorySchema.parse(data);
    const result = await PrimaryCategoryService.createPrimaryCategory(
      validatedData
    );

    if (result.success) {
      revalidatePath("/admin/category/primaryCategory");
    }

    return {
      success: result.success,
      data: result.data,
      error: result.message,
    };
  } catch (error) {
    console.error("Create primary category error:", error);
    return {
      success: false,
      error: "Failed to create primary category",
    };
  }
}

// Keep the original action for backward compatibility
export async function getAllPrimaryCategories(): Promise<PrimaryCategoryResponse> {
  try {
    const result = await PrimaryCategoryService.getAllPrimaryCategories();
    return {
      success: result.success,
      data: result.data,
      error: result.message,
    };
  } catch (error) {
    console.error("Get primary categories error:", error);
    return {
      success: false,
      error: "Failed to fetch primary categories",
    };
  }
}

// New paginated action
export async function getPrimaryCategoriesPaginated(
  params: PaginationParams & { parentCategoryId?: string } = {}
): Promise<PaginatedResponse<IPrimaryCategory>> {
  try {
    const result = await PrimaryCategoryService.getPrimaryCategoriesPaginated(
      params
    );
    return result;
  } catch (error) {
    console.error("Get paginated primary categories error:", error);
    return {
      success: false,
      error: "Failed to fetch primary categories",
    };
  }
}

export async function getPrimaryCategoryById(
  id: string
): Promise<PrimaryCategoryResponse> {
  try {
    const result = await PrimaryCategoryService.getPrimaryCategoryById(id);
    return {
      success: result.success,
      data: result.data,
      error: result.message,
    };
  } catch (error) {
    console.error("Get primary category error:", error);
    return {
      success: false,
      error: "Failed to fetch primary category",
    };
  }
}

export async function updatePrimaryCategoryById(
  id: string,
  data: Partial<IPrimaryCategory>
): Promise<PrimaryCategoryResponse> {
  try {
    const validatedData = primaryCategorySchema.partial().parse(data);
    const result = await PrimaryCategoryService.updatePrimaryCategory(
      id,
      validatedData
    );

    if (result.success) {
      revalidatePath("/admin/category/primaryCategory");
    }

    return {
      success: result.success,
      data: result.data,
      error: result.message,
    };
  } catch (error) {
    console.error("Update primary category error:", error);
    return {
      success: false,
      error: "Failed to update primary category",
    };
  }
}

export async function deletePrimaryCategoryById(
  id: string
): Promise<PrimaryCategoryResponse> {
  try {
    const result = await PrimaryCategoryService.deletePrimaryCategory(id);

    if (result.success) {
      revalidatePath("/admin/category/primaryCategory");
    }

    return {
      success: result.success,
      data: result.data!,
      error: result.message,
    };
  } catch (error) {
    console.error("Delete primary category error:", error);
    return {
      success: false,
      error: "Failed to delete primary category",
    };
  }
}

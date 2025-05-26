"use server";

import { SecondaryCategoryService } from "@/services/secondaryCategory.service";
import { secondaryCategorySchema } from "../validations";
import { revalidatePath } from "next/cache";

export type SecondaryCategoryResponse = {
  success: boolean;
  data?: ISecondaryCategory | ISecondaryCategory[] | null;
  error?: string;
};

export async function createSecondaryCategory(
  data: ISecondaryCategory
): Promise<SecondaryCategoryResponse> {
  try {
    const validatedData = secondaryCategorySchema.parse(data);
    const result = await SecondaryCategoryService.createSecondaryCategory(
      validatedData
    );

    if (result.success) {
      revalidatePath("/admin/category/secondaryCategory");
    }

    return {
      success: result.success,
      data: result.data,
      error: result.message,
    };
  } catch (error) {
    console.error("Create secondary category error:", error);
    return {
      success: false,
      error: "Failed to create secondary category",
    };
  }
}

export async function getAllSecondaryCategories(): Promise<SecondaryCategoryResponse> {
  try {
    const result = await SecondaryCategoryService.getAllSecondaryCategories();
    return {
      success: result.success,
      data: result.data,
      error: result.message,
    };
  } catch (error) {
    console.error("Get secondary categories error:", error);
    return {
      success: false,
      error: "Failed to fetch secondary categories",
    };
  }
}

export async function getSecondaryCategoryById(
  id: string
): Promise<SecondaryCategoryResponse> {
  try {
    const result = await SecondaryCategoryService.getSecondaryCategoryById(id);
    return {
      success: result.success,
      data: result.data,
      error: result.message,
    };
  } catch (error) {
    console.error("Get secondary category error:", error);
    return {
      success: false,
      error: "Failed to fetch secondary category",
    };
  }
}

export async function updateSecondaryCategoryById(
  id: string,
  data: Partial<ISecondaryCategory>
): Promise<SecondaryCategoryResponse> {
  try {
    const validatedData = secondaryCategorySchema.partial().parse(data);
    const result = await SecondaryCategoryService.updateSecondaryCategory(
      id,
      validatedData
    );

    if (result.success) {
      revalidatePath("/admin/category/secondaryCategory");
    }

    return {
      success: result.success,
      data: result.data,
      error: result.message,
    };
  } catch (error) {
    console.error("Update secondary category error:", error);
    return {
      success: false,
      error: "Failed to update secondary category",
    };
  }
}

export async function deleteSecondaryCategoryById(
  id: string
): Promise<SecondaryCategoryResponse> {
  try {
    const result = await SecondaryCategoryService.deleteSecondaryCategory(id);

    if (result.success) {
      revalidatePath("/admin/category/secondaryCategory");
    }

    return {
      success: result.success,
      data: result.data!,
      error: result.message,
    };
  } catch (error) {
    console.error("Delete secondary category error:", error);
    return {
      success: false,
      error: "Failed to delete secondary category",
    };
  }
}

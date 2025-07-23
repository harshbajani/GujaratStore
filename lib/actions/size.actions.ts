"use server";

import { revalidatePath } from "next/cache";
import { SizeService } from "@/services/size.service";

export async function createSize(
  label: string,
  value: string,
  isActive: boolean = true
): Promise<SizeResponse> {
  try {
    const result = await SizeService.createSize({ label, value, isActive });
    if (result.success) revalidatePath("/vendor/size");
    return result;
  } catch (error) {
    console.error("Create size action error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create size",
    };
  }
}

export async function getAllSizes(
  params: PaginationParams = {}
): Promise<PaginatedResponse<ISize>> {
  try {
    const result = await SizeService.getAllSizes(params);
    return result;
  } catch (error) {
    console.error("Get sizes action error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch sizes",
    };
  }
}

export async function getAllSizesLegacy(): Promise<SizeResponse> {
  try {
    const result = await SizeService.getAllSizesLegacy();
    return result;
  } catch (error) {
    console.error("Get sizes legacy action error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch sizes",
    };
  }
}

export async function getSizeById(id: string): Promise<SizeResponse> {
  try {
    if (!id || typeof id !== "string") {
      return {
        success: false,
        error: "Invalid size ID",
      };
    }

    const result = await SizeService.getSizeById(id);
    return result;
  } catch (error) {
    console.error("Get size by id action error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch size",
    };
  }
}

export async function updateSize(
  id: string,
  data: Partial<ISize>
): Promise<SizeResponse> {
  try {
    if (!id || typeof id !== "string") {
      return {
        success: false,
        error: "Invalid size ID",
      };
    }

    if (!data || Object.keys(data).length === 0) {
      return {
        success: false,
        error: "No data provided for update",
      };
    }

    const result = await SizeService.updateSize(id, data);
    if (result.success) revalidatePath("/vendor/size");
    return result;
  } catch (error) {
    console.error("Update size action error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update size",
    };
  }
}

export async function deleteSize(id: string): Promise<SizeResponse> {
  try {
    if (!id || typeof id !== "string") {
      return {
        success: false,
        error: "Invalid size ID",
      };
    }

    const result = await SizeService.deleteSize(id);
    if (result.success) revalidatePath("/vendor/size");
    return result;
  } catch (error) {
    console.error("Delete size action error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete size",
    };
  }
}

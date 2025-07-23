"use server";

import { connectToDB } from "../mongodb";
import { brandSchema } from "../validations";
import { BrandService } from "@/services/brand.service";
import { z } from "zod";

type BrandFormData = z.infer<typeof brandSchema>;

export interface BrandResponse {
  success: boolean;
  data?: TransformedBrand | TransformedBrand[];
  error?: string;
}

export async function createBrand(data: BrandFormData): Promise<BrandResponse> {
  try {
    await connectToDB();
    const validatedData = brandSchema.parse(data);

    const result = await BrandService.createBrand(validatedData);

    if (!result.success) {
      return {
        success: false,
        error: result.error || "Brand creation failed",
      };
    }

    return {
      success: true,
      data: result.data!,
    };
  } catch (error) {
    console.error("Brand creation failed", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Brand creation failed",
    };
  }
}

export async function getAllBrands(
  params: PaginationParams = {}
): Promise<PaginatedResponse<TransformedBrand>> {
  try {
    await connectToDB();

    const result = await BrandService.getAllBrands(params);

    return result;
  } catch (error) {
    console.error("Error fetching brands", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error fetching brands",
    };
  }
}

export async function getAllBrandsLegacy(): Promise<BrandResponse> {
  try {
    await connectToDB();

    const result = await BrandService.getAllBrandsLegacy();

    return {
      ...result,
      data: result.data === null ? undefined : result.data,
    };
  } catch (error) {
    console.error("Error fetching brands", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error fetching brands",
      data: [],
    };
  }
}

export async function getBrandById(id: string): Promise<BrandResponse> {
  try {
    await connectToDB();

    if (!id || typeof id !== "string") {
      return {
        success: false,
        error: "Invalid brand ID",
      };
    }

    const result = await BrandService.getBrandById(id);

    return {
      ...result,
      data: result.data === null ? undefined : result.data,
    };
  } catch (error) {
    console.error("Error fetching brand by id", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Error fetching brand by id",
    };
  }
}

export async function updateBrand(
  id: string,
  data: Partial<BrandFormData>
): Promise<BrandResponse> {
  try {
    await connectToDB();

    if (!id || typeof id !== "string") {
      return {
        success: false,
        error: "Invalid brand ID",
      };
    }

    // Validate the data if it contains fields that need validation
    if (Object.keys(data).length > 0) {
      const partialSchema = brandSchema.partial();
      const validatedData = partialSchema.parse(data);

      const result = await BrandService.updateBrand(id, validatedData);

      return {
        ...result,
        data: result.data === null ? undefined : result.data,
      };
    }

    return {
      success: false,
      error: "No data provided for update",
    };
  } catch (error) {
    console.error("Error updating brand", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error updating brand",
    };
  }
}

export async function deleteBrand(id: string): Promise<BrandResponse> {
  try {
    await connectToDB();

    if (!id || typeof id !== "string") {
      return {
        success: false,
        error: "Invalid brand ID",
      };
    }

    const result = await BrandService.deleteBrand(id);

    return {
      ...result,
      data: result.data === null ? undefined : result.data,
    };
  } catch (error) {
    console.error("Error deleting brand", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error deleting brand",
    };
  }
}

// Additional helper functions for pagination
export async function getBrandsWithPagination(
  page: number = 1,
  limit: number = 10,
  search: string = "",
  sortBy: string = "name",
  sortOrder: "asc" | "desc" = "asc"
): Promise<PaginatedResponse<TransformedBrand>> {
  return getAllBrands({
    page,
    limit,
    search,
    sortBy,
    sortOrder,
  });
}

export async function searchBrands(
  searchTerm: string,
  page: number = 1,
  limit: number = 10
): Promise<PaginatedResponse<TransformedBrand>> {
  return getAllBrands({
    page,
    limit,
    search: searchTerm,
    sortBy: "name",
    sortOrder: "asc",
  });
}

import { CacheService } from "./cache.service";
import { AttributeService } from "./attribute.service";
import { ParentCategoryService } from "./parentCategory.service";
import { PrimaryCategoryService } from "./primaryCategory.service";
import { SecondaryCategoryService } from "./secondaryCategory.service";
import { connectToDB } from "@/lib/mongodb";

interface DropdownData {
  parentCategories: IParentCategory[];
  primaryCategories: IPrimaryCategory[];
  secondaryCategories: SecondaryCategoryWithPopulatedFields[];
  attributes: IAttribute[];
}

export class DropdownService {
  private static CACHE_TTL = 600; // 10 minutes
  private static CACHE_KEY = "dropdown:all";

  static async getAllDropdownData(): Promise<ActionResponse<DropdownData>> {
    try {
      await connectToDB();
      // Check cache first
      const cached = await CacheService.get<DropdownData>(this.CACHE_KEY);
      if (cached) {
        return {
          success: true,
          data: cached,
          message: "Dropdown data retrieved from cache",
        };
      }

      // Fetch all data in parallel if not cached
      const [
        parentCategoriesResponse,
        primaryCategoriesResponse,
        secondaryCategoriesResponse,
        attributesResponse,
      ] = await Promise.all([
        ParentCategoryService.getAllParentCategories(),
        PrimaryCategoryService.getAllPrimaryCategories(),
        SecondaryCategoryService.getAllSecondaryCategories(),
        AttributeService.getAllAttributes(),
      ]);

      // Check if all responses are successful
      if (
        !parentCategoriesResponse.success ||
        !primaryCategoriesResponse.success ||
        !secondaryCategoriesResponse.success ||
        !attributesResponse.success
      ) {
        return {
          success: false,
          message: "Failed to fetch one or more dropdown data sets",
        };
      }

      const dropdownData: DropdownData = {
        parentCategories:
          (parentCategoriesResponse.data as IParentCategory[]) || [],
        primaryCategories:
          (primaryCategoriesResponse.data as IPrimaryCategory[]) || [],
        secondaryCategories:
          (secondaryCategoriesResponse.data as SecondaryCategoryWithPopulatedFields[]) ||
          [],
        attributes: (attributesResponse.data as IAttribute[]) || [],
      };

      // Cache the combined data
      await CacheService.set(this.CACHE_KEY, dropdownData, this.CACHE_TTL);

      return {
        success: true,
        data: dropdownData,
        message: "Dropdown data retrieved successfully",
      };
    } catch (error) {
      console.error("Get dropdown data error:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch dropdown data",
      };
    }
  }

  static async invalidateCache(): Promise<void> {
    try {
      await CacheService.delete(this.CACHE_KEY);
    } catch (error) {
      console.error("Dropdown cache invalidation error:", error);
    }
  }

  // Pre-warm the cache with dropdown data
  static async prewarmCache(): Promise<void> {
    try {
      await this.getAllDropdownData();
    } catch (error) {
      console.error("Cache prewarming error:", error);
    }
  }
}

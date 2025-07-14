/* eslint-disable @typescript-eslint/no-explicit-any */
import Brand from "@/lib/models/brand.model";
import { CacheService } from "./cache.service";
import { Types } from "mongoose";
import { getFileById } from "@/lib/utils/file.utils";

export class BrandService {
  private static CACHE_TTL = 300; // 5 minutes

  private static async getCacheKey(key: string): Promise<string> {
    return `brands:${key}`;
  }

  private static transformBrand(brand: any): TransformedBrand {
    return {
      _id: brand._id.toString(),
      name: brand.name,
      imageId: brand.imageId,
      metaTitle: brand.metaTitle,
      metaKeywords: brand.metaKeywords,
      metaDescription: brand.metaDescription,
    };
  }

  static async createBrand(data: Partial<IBrand>): Promise<BrandResponse> {
    try {
      const existingBrand = await Brand.findOne({ name: data.name });
      if (existingBrand) {
        return {
          success: false,
          error: "Brand with this name already exists",
        };
      }

      const brand = await Brand.create(data);
      await this.invalidateCache();

      return {
        success: true,
        data: this.transformBrand(brand),
      };
    } catch (error) {
      console.error("Create brand error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create brand",
      };
    }
  }

  static async getAllBrands(
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<TransformedBrand>> {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        sortBy = "name",
        sortOrder = "asc",
      } = params;

      // Create cache key based on all parameters
      const cacheKey = await this.getCacheKey(
        `paginated:${page}:${limit}:${search}:${sortBy}:${sortOrder}`
      );

      const cached = await CacheService.get<
        PaginatedResponse<TransformedBrand>
      >(cacheKey);
      if (cached) {
        return cached;
      }

      // Build query for search
      const query: any = {};
      if (search) {
        query.name = { $regex: search, $options: "i" };
      }

      // Build sort object
      const sort: any = {};
      sort[sortBy] = sortOrder === "desc" ? -1 : 1;

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute queries in parallel
      const [brands, totalCount] = await Promise.all([
        Brand.find(query).sort(sort).skip(skip).limit(limit).lean(),
        Brand.countDocuments(query),
      ]);

      // Transform brands with image data
      const transformedBrands: TransformedBrand[] = await Promise.all(
        brands.map(async (brand) => {
          const transformedBrand = this.transformBrand(brand);
          try {
            const image = await getFileById(brand.imageId);
            return {
              ...transformedBrand,
              image: image.buffer.toString("base64"),
            };
          } catch (error) {
            console.warn(
              `Failed to fetch image for brand ${brand._id}:`,
              error
            );
            return transformedBrand;
          }
        })
      );

      const totalPages = Math.ceil(totalCount / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      const result: PaginatedResponse<TransformedBrand> = {
        success: true,
        data: transformedBrands,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: totalCount,
          itemsPerPage: limit,
          hasNext,
          hasPrev,
        },
      };

      // Cache the result
      await CacheService.set(cacheKey, result, this.CACHE_TTL);

      return result;
    } catch (error) {
      console.error("Get brands error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch brands",
      };
    }
  }

  static async getAllBrandsLegacy(): Promise<BrandResponse> {
    try {
      const cacheKey = await this.getCacheKey("all");
      const cached = await CacheService.get<TransformedBrand[]>(cacheKey);

      if (cached) {
        return { success: true, data: cached };
      }

      const brands = await Brand.find({}).sort({ createdAt: -1 }).lean();

      const transformedBrands: TransformedBrand[] = await Promise.all(
        brands.map(async (brand) => {
          const transformedBrand = this.transformBrand(brand);
          try {
            const image = await getFileById(brand.imageId);
            return {
              ...transformedBrand,
              image: image.buffer.toString("base64"),
            };
          } catch (error) {
            console.warn(
              `Failed to fetch image for brand ${brand._id}:`,
              error
            );
            return transformedBrand;
          }
        })
      );

      await CacheService.set(cacheKey, transformedBrands, this.CACHE_TTL);

      return {
        success: true,
        data: transformedBrands,
      };
    } catch (error) {
      console.error("Get brands error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch brands",
        data: [],
      };
    }
  }

  static async getBrandById(id: string): Promise<BrandResponse> {
    try {
      const cacheKey = await this.getCacheKey(id);
      const cached = await CacheService.get<TransformedBrand>(cacheKey);

      if (cached) {
        return { success: true, data: cached };
      }

      if (!Types.ObjectId.isValid(id)) {
        return { success: false, error: "Invalid brand ID" };
      }

      const brand = await Brand.findById(id).lean<IBrand>();
      if (!brand) {
        return { success: false, error: "Brand not found" };
      }

      const transformedBrand = this.transformBrand(brand);

      try {
        const image = await getFileById(brand.imageId);
        transformedBrand.image = image.buffer.toString("base64");
      } catch (error) {
        console.warn(`Failed to fetch image for brand ${id}:`, error);
      }

      await CacheService.set(cacheKey, transformedBrand, this.CACHE_TTL);

      return {
        success: true,
        data: transformedBrand,
      };
    } catch (error) {
      console.error("Get brand by id error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch brand",
      };
    }
  }

  static async updateBrand(
    id: string,
    data: Partial<IBrand>
  ): Promise<BrandResponse> {
    try {
      const brand = await Brand.findByIdAndUpdate(
        id,
        { ...data },
        { new: true, runValidators: true }
      ).lean();

      if (!brand) {
        return { success: false, error: "Brand not found" };
      }

      await this.invalidateCache();

      return {
        success: true,
        data: this.transformBrand(brand),
      };
    } catch (error) {
      console.error("Update brand error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to update brand",
      };
    }
  }

  static async deleteBrand(id: string): Promise<BrandResponse> {
    try {
      const brand = await Brand.findByIdAndDelete(id).lean();

      if (!brand) {
        return { success: false, error: "Brand not found" };
      }

      await this.invalidateCache();

      return {
        success: true,
        data: this.transformBrand(brand),
      };
    } catch (error) {
      console.error("Delete brand error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to delete brand",
      };
    }
  }

  // FIXED: Now invalidates ALL brand keys, not just "all"
  private static async invalidateCache(): Promise<void> {
    try {
      const keys = await CacheService.keys("brands:*");
      await Promise.all(keys.map((key) => CacheService.delete(key)));
    } catch (error) {
      console.error("Cache invalidation error:", error);
    }
  }
}

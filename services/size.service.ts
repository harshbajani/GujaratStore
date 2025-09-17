/* eslint-disable @typescript-eslint/no-explicit-any */
import Size from "@/lib/models/size.model";
import { connectToDB } from "@/lib/mongodb";
import { CacheService } from "./cache.service";
import { Types } from "mongoose";

export class SizeService {
  private static CACHE_TTL = 300; // 5 minutes

  private static async getCacheKey(key: string): Promise<string> {
    return `sizes:${key}`;
  }

  private static transformSize(size: any): ISize {
    return {
      id: size._id.toString(),
      _id: size._id.toString(),
      label: size.label,
      value: size.value,
      isActive: size.isActive,
      createdAt: size.createdAt,
      updatedAt: size.updatedAt,
    };
  }

  static async createSize(data: Partial<ISize>): Promise<SizeResponse> {
    try {
      await connectToDB();
      const existingSize = await Size.findOne({ label: data.label });
      if (existingSize) {
        return {
          success: false,
          error: "Size with this label already exists",
        };
      }

      const size = await Size.create(data);
      await this.invalidateCache();

      return {
        success: true,
        data: this.transformSize(size),
      };
    } catch (error) {
      console.error("Create size error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create size",
      };
    }
  }

  static async getAllSizes(
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<ISize>> {
    try {
      await connectToDB();
      const {
        page = 1,
        limit = 10,
        search = "",
        sortBy = "label",
        sortOrder = "asc",
      } = params;

      // Create cache key based on all parameters
      const cacheKey = await this.getCacheKey(
        `paginated:${page}:${limit}:${search}:${sortBy}:${sortOrder}`
      );

      const cached = await CacheService.get<PaginatedResponse<ISize>>(cacheKey);
      if (cached) {
        return cached;
      }

      // Build query for search
      const query: any = {};
      if (search) {
        query.$or = [
          { label: { $regex: search, $options: "i" } },
          { value: { $regex: search, $options: "i" } },
        ];
      }

      // Build sort object
      const sort: any = {};
      sort[sortBy] = sortOrder === "desc" ? -1 : 1;

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute queries in parallel
      const [sizes, totalCount] = await Promise.all([
        Size.find(query).sort(sort).skip(skip).limit(limit).lean(),
        Size.countDocuments(query),
      ]);

      // Transform sizes
      const transformedSizes: ISize[] = sizes.map(this.transformSize);

      const totalPages = Math.ceil(totalCount / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      const result: PaginatedResponse<ISize> = {
        success: true,
        data: transformedSizes,
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
      console.error("Get sizes error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch sizes",
      };
    }
  }

  static async getAllSizesLegacy(): Promise<SizeResponse> {
    try {
      await connectToDB();
      const cacheKey = await this.getCacheKey("all");
      const cached = await CacheService.get<ISize[]>(cacheKey);

      if (cached) {
        return { success: true, data: cached };
      }

      const sizes = await Size.find({}).sort({ createdAt: -1 }).lean();
      const transformedSizes = sizes.map(this.transformSize);

      await CacheService.set(cacheKey, transformedSizes, this.CACHE_TTL);

      return {
        success: true,
        data: transformedSizes,
      };
    } catch (error) {
      console.error("Get sizes error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch sizes",
      };
    }
  }

  static async getSizeById(id: string): Promise<SizeResponse> {
    try {
      await connectToDB();
      const cacheKey = await this.getCacheKey(id);
      const cached = await CacheService.get<ISize>(cacheKey);

      if (cached) {
        return { success: true, data: cached };
      }

      if (!Types.ObjectId.isValid(id)) {
        return { success: false, error: "Invalid size ID" };
      }

      const size = await Size.findById(id).lean();
      if (!size) {
        return { success: false, error: "Size not found" };
      }

      const transformedSize = this.transformSize(size);
      await CacheService.set(cacheKey, transformedSize, this.CACHE_TTL);

      return {
        success: true,
        data: transformedSize,
      };
    } catch (error) {
      console.error("Get size by id error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch size",
      };
    }
  }

  static async updateSize(
    id: string,
    data: Partial<ISize>
  ): Promise<SizeResponse> {
    try {
      await connectToDB();
      const size = await Size.findByIdAndUpdate(
        id,
        { ...data },
        { new: true, runValidators: true }
      ).lean();

      if (!size) {
        return { success: false, error: "Size not found" };
      }

      await this.invalidateCache();

      return {
        success: true,
        data: this.transformSize(size),
      };
    } catch (error) {
      console.error("Update size error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update size",
      };
    }
  }

  static async deleteSize(id: string): Promise<SizeResponse> {
    try {
      await connectToDB();
      const size = await Size.findByIdAndDelete(id).lean();

      if (!size) {
        return { success: false, error: "Size not found" };
      }

      await this.invalidateCache();

      return {
        success: true,
        data: this.transformSize(size),
      };
    } catch (error) {
      console.error("Delete size error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete size",
      };
    }
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

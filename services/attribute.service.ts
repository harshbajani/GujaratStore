/* eslint-disable @typescript-eslint/no-explicit-any */
import Attributes from "@/lib/models/attribute.model";
import mongoose from "mongoose";
import { CacheService } from "./cache.service";

export class AttributeService {
  private static CACHE_TTL = 300; // 5 minutes

  private static async getCacheKey(key: string): Promise<string> {
    return `attributes:${key}`;
  }

  private static serializeDocument(doc: mongoose.Document): IAttribute | null {
    if (!doc) return null;
    const serialized = doc.toJSON();
    return {
      id: serialized._id.toString(),
      _id: serialized._id.toString(),
      name: serialized.name,
      isActive: serialized.isActive,
      createdAt: serialized.createdAt,
      updatedAt: serialized.updatedAt,
    };
  }

  static async createAttribute(
    name: string,
    isActive: boolean
  ): Promise<AttributeResponse> {
    try {
      const existingAttribute = await Attributes.findOne({ name });
      if (existingAttribute) {
        return {
          success: false,
          error: "Attribute with this name already exists",
        };
      }

      const attribute = await Attributes.create({ name, isActive });
      await this.invalidateCache();

      return {
        success: true,
        data: this.serializeDocument(attribute),
      };
    } catch (error) {
      console.error("Create attribute error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create attribute",
      };
    }
  }

  static async getAllAttributes(
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<IAttribute>> {
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

      const cached = await CacheService.get<PaginatedResponse<IAttribute>>(
        cacheKey
      );
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
      const [attributes, totalCount] = await Promise.all([
        Attributes.find(query).sort(sort).skip(skip).limit(limit),
        Attributes.countDocuments(query),
      ]);

      const serializedAttributes = attributes
        .map(this.serializeDocument)
        .filter((attr): attr is IAttribute => attr !== null);

      const totalPages = Math.ceil(totalCount / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      const result: PaginatedResponse<IAttribute> = {
        success: true,
        data: serializedAttributes,
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
      console.error("Get attributes error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch attributes",
      };
    }
  }

  static async getAllAttributesLegacy(): Promise<AttributeResponse> {
    try {
      const cacheKey = await this.getCacheKey("all");
      const cached = await CacheService.get<IAttribute[]>(cacheKey);

      if (cached) {
        return { success: true, data: cached };
      }

      const attributes = await Attributes.find({}).sort({ name: 1 });
      const serializedAttributes = attributes
        .map(this.serializeDocument)
        .filter((attr): attr is IAttribute => attr !== null);

      await CacheService.set(cacheKey, serializedAttributes, this.CACHE_TTL);

      return { success: true, data: serializedAttributes };
    } catch (error) {
      console.error("Get attributes error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch attributes",
      };
    }
  }

  static async updateAttribute(
    id: string,
    data: { name: string; isActive: boolean }
  ): Promise<AttributeResponse> {
    try {
      const updatedAttribute = await Attributes.findByIdAndUpdate(
        id,
        { ...data },
        { new: true, runValidators: true }
      );

      if (!updatedAttribute) {
        return { success: false, error: "Attribute not found" };
      }

      await this.invalidateCache();

      return {
        success: true,
        data: this.serializeDocument(updatedAttribute),
      };
    } catch (error) {
      console.error("Update attribute error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to update attribute",
      };
    }
  }

  static async deleteAttribute(id: string): Promise<AttributeResponse> {
    try {
      const attribute = await Attributes.findByIdAndDelete(id);

      if (!attribute) {
        return { success: false, error: "Attribute not found" };
      }

      await this.invalidateCache();

      return {
        success: true,
        data: this.serializeDocument(attribute),
      };
    } catch (error) {
      console.error("Delete attribute error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to delete attribute",
      };
    }
  }

  static async getAttributeById(id: string): Promise<AttributeResponse> {
    try {
      const cacheKey = await this.getCacheKey(id);
      const cached = await CacheService.get<IAttribute>(cacheKey);

      if (cached) {
        return { success: true, data: cached };
      }

      const attribute = await Attributes.findById(id);

      if (!attribute) {
        return { success: false, error: "Attribute not found" };
      }

      const serializedAttribute = this.serializeDocument(attribute);

      if (serializedAttribute) {
        await CacheService.set(cacheKey, serializedAttribute, this.CACHE_TTL);
      }

      return {
        success: true,
        data: serializedAttribute,
      };
    } catch (error) {
      console.error("Get attribute by id error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch attribute",
      };
    }
  }

  // FIXED: Now invalidates ALL attribute keys, not just "all"
  private static async invalidateCache(): Promise<void> {
    try {
      const keys = await CacheService.keys("attributes:*");
      await Promise.all(keys.map((key) => CacheService.delete(key)));
    } catch (error) {
      console.error("Cache invalidation error:", error);
    }
  }
}

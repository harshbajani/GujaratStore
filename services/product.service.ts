/* eslint-disable @typescript-eslint/no-explicit-any */
import { Types } from "mongoose";
import Products from "@/lib/models/product.model";
import { CacheService } from "./cache.service";

export class ProductService {
  private static CACHE_TTL = 300; // 5 minutes

  private static async getCacheKey(key: string): Promise<string> {
    return `products:${key}`;
  }

  private static transformProduct(product: any): IProductResponse {
    return {
      ...product,
      _id: product._id.toString(),
      vendorId: product.vendorId, // Ensure vendorId is included
      productImages: product.productImages,
      productCoverImage: product.productCoverImage,
    };
  }

  static async createProduct(
    data: IProduct
  ): Promise<{ success: boolean; data?: IProductResponse; error?: string }> {
    try {
      const product = await Products.create(data);
      await this.invalidateCache();

      return {
        success: true,
        data: await this.transformProduct(product),
      };
    } catch (error) {
      console.error("Create product error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create product",
      };
    }
  }

  static async getProducts(
    params: PaginationParams = {},
    vendorId?: string
  ): Promise<PaginatedResponse<IProductResponse>> {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        sortBy = "productName",
        sortOrder = "desc",
      } = params;

      // Create cache key based on all parameters
      const cacheKey = await this.getCacheKey(
        `paginated:${
          vendorId || "all"
        }:${page}:${limit}:${search}:${sortBy}:${sortOrder}`
      );

      const cached = await CacheService.get<
        PaginatedResponse<IProductResponse>
      >(cacheKey);
      if (cached) {
        return cached;
      }

      // Build query for search and vendor filter
      const query: any = {};

      // Add vendor filter if provided
      if (vendorId) {
        query.vendorId = vendorId;
      }

      // Add search functionality - match your product fields
      if (search) {
        query.$or = [
          { productName: { $regex: search, $options: "i" } },
          { productDescription: { $regex: search, $options: "i" } },
          { sku: { $regex: search, $options: "i" } },
        ];
      }

      // Build sort object
      const sort: any = {};
      sort[sortBy] = sortOrder === "desc" ? -1 : 1;

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute queries in parallel
      const [products, totalCount] = await Promise.all([
        Products.find(query)
          .populate([
            { path: "parentCategory", select: "name" },
            { path: "primaryCategory", select: "name" },
            { path: "secondaryCategory", select: "name" },
            { path: "brands", select: "name" },
            { path: "attributes.attributeId", select: "name" },
            { path: "productSize", select: "label" },
            { path: "productReviews", select: "rating" },
          ])
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        Products.countDocuments(query),
      ]);

      // Transform products
      const transformedProducts = products.map(this.transformProduct);

      const totalPages = Math.ceil(totalCount / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      const result: PaginatedResponse<IProductResponse> = {
        success: true,
        data: transformedProducts,
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
      console.error("Get products paginated error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch products",
      };
    }
  }

  static async getProductsLegacy(
    vendorId?: string
  ): Promise<{ success: boolean; data?: IProductResponse[]; error?: string }> {
    try {
      const cacheKey = await this.getCacheKey(vendorId || "all");
      const cached = await CacheService.get<IProductResponse[]>(cacheKey);

      if (cached) {
        return { success: true, data: cached };
      }

      const query = vendorId ? { vendorId } : {};
      const products = await Products.find(query)
        .populate([
          { path: "parentCategory", select: "name" },
          { path: "primaryCategory", select: "name" },
          { path: "secondaryCategory", select: "name" },
          { path: "brands", select: "name" },
          { path: "attributes.attributeId", select: "name" },
          { path: "productSize", select: "label" },
          { path: "productReviews", select: "rating" },
        ])
        .lean();

      const transformedProducts = products.map(this.transformProduct);
      await CacheService.set(cacheKey, transformedProducts, this.CACHE_TTL);

      return {
        success: true,
        data: transformedProducts,
      };
    } catch (error) {
      console.error("Get products error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch products",
      };
    }
  }

  static async getProductById(
    id: string
  ): Promise<{ success: boolean; data?: IProductResponse; error?: string }> {
    try {
      const cacheKey = await this.getCacheKey(id);
      const cached = await CacheService.get<IProductResponse>(cacheKey);

      if (cached) {
        return { success: true, data: cached };
      }

      if (!Types.ObjectId.isValid(id)) {
        return { success: false, error: "Invalid product ID" };
      }

      const product = await Products.findById(id)
        .populate([
          { path: "parentCategory", select: "name" },
          { path: "primaryCategory", select: "name" },
          { path: "secondaryCategory", select: "name" },
          { path: "brands", select: "name" },
          { path: "attributes.attributeId", select: "name" },
          { path: "productSize", select: "label" },
          { path: "productReviews", select: "rating" },
        ])
        .lean();

      if (!product) {
        return { success: false, error: "Product not found" };
      }

      const transformedProduct = await this.transformProduct(product);
      await CacheService.set(cacheKey, transformedProduct, this.CACHE_TTL);

      return {
        success: true,
        data: transformedProduct,
      };
    } catch (error) {
      console.error("Get product by id error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch product",
      };
    }
  }

  static async updateProduct(
    id: string,
    data: Partial<IProduct>
  ): Promise<{ success: boolean; data?: IProductResponse; error?: string }> {
    try {
      const product = await Products.findByIdAndUpdate(
        id,
        { ...data },
        { new: true, runValidators: true }
      )
        .populate([
          { path: "parentCategory", select: "name" },
          { path: "primaryCategory", select: "name" },
          { path: "secondaryCategory", select: "name" },
          { path: "brands", select: "name" },
          { path: "attributes.attributeId", select: "name" },
          { path: "productSize", select: "label" },
          { path: "productReviews", select: "rating" },
        ])
        .lean();

      if (!product) {
        return { success: false, error: "Product not found" };
      }

      await this.invalidateCache();
      const transformedProduct = await this.transformProduct(product);

      return {
        success: true,
        data: transformedProduct,
      };
    } catch (error) {
      console.error("Update product error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to update product",
      };
    }
  }

  static async deleteProduct(
    id: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const deleted = await Products.findByIdAndDelete(id);
      if (!deleted) {
        return { success: false, error: "Product not found" };
      }

      // Invalidate all product cache
      await this.invalidateCache();

      return { success: true };
    } catch (error) {
      console.error("Delete product error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to delete product",
      };
    }
  }

  static async getProductsByBrand(
    brandId: string,
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<IProductResponse>> {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        sortBy = "productName",
        sortOrder = "desc",
      } = params;

      // Create cache key based on all parameters
      const cacheKey = await this.getCacheKey(
        `brand:${brandId}:${page}:${limit}:${search}:${sortBy}:${sortOrder}`
      );

      const cached = await CacheService.get<
        PaginatedResponse<IProductResponse>
      >(cacheKey);
      if (cached) {
        return cached;
      }

      // Build query for brand filter and search
      const query: any = {
        brands: brandId,
        productStatus: true, // Only show active products
      };

      // Add search functionality
      if (search) {
        query.$or = [
          { productName: { $regex: search, $options: "i" } },
          { productDescription: { $regex: search, $options: "i" } },
          { productSKU: { $regex: search, $options: "i" } },
        ];
      }

      // Build sort object
      const sort: any = {};
      sort[sortBy] = sortOrder === "desc" ? -1 : 1;

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute queries in parallel
      const [products, totalCount] = await Promise.all([
        Products.find(query)
          .populate([
            { path: "parentCategory", select: "name" },
            { path: "primaryCategory", select: "name" },
            { path: "secondaryCategory", select: "name" },
            { path: "brands", select: "name" },
            { path: "attributes.attributeId", select: "name" },
            { path: "productSize", select: "label" },
            { path: "productReviews", select: "rating" },
          ])
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        Products.countDocuments(query),
      ]);

      // Transform products
      const transformedProducts = products.map(this.transformProduct);

      const totalPages = Math.ceil(totalCount / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      const result: PaginatedResponse<IProductResponse> = {
        success: true,
        data: transformedProducts,
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
      console.error("Get products by brand error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch products",
      };
    }
  }

  static async getProductsByBrandLegacy(
    brandId: string
  ): Promise<{ success: boolean; data?: IProductResponse[]; error?: string }> {
    try {
      const cacheKey = await this.getCacheKey(`brand:${brandId}:all`);
      const cached = await CacheService.get<IProductResponse[]>(cacheKey);

      if (cached) {
        return { success: true, data: cached };
      }

      const query = {
        brands: brandId,
        productStatus: true, // Only show active products
      };
      
      const products = await Products.find(query)
        .populate([
          { path: "parentCategory", select: "name" },
          { path: "primaryCategory", select: "name" },
          { path: "secondaryCategory", select: "name" },
          { path: "brands", select: "name" },
          { path: "attributes.attributeId", select: "name" },
          { path: "productSize", select: "label" },
          { path: "productReviews", select: "rating" },
        ])
        .lean();

      const transformedProducts = products.map(this.transformProduct);
      await CacheService.set(cacheKey, transformedProducts, this.CACHE_TTL);

      return {
        success: true,
        data: transformedProducts,
      };
    } catch (error) {
      console.error("Get products by brand legacy error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch products",
      };
    }
  }

  private static async invalidateCache(): Promise<void> {
    try {
      const keys = await CacheService.keys("products:*");
      await Promise.all(keys.map((key) => CacheService.delete(key)));
    } catch (error) {
      console.error("Cache invalidation error:", error);
    }
  }
}

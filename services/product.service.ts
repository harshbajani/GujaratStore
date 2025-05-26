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

  private static async invalidateCache(): Promise<void> {
    try {
      const keys = await CacheService.keys("products:*");
      await Promise.all(keys.map((key) => CacheService.delete(key)));
    } catch (error) {
      console.error("Cache invalidation error:", error);
    }
  }
}

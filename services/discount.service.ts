/* eslint-disable @typescript-eslint/no-explicit-any */
import { connectToDB } from "@/lib/mongodb";
import Discount, {
  DiscountType,
  DiscountTargetType,
} from "@/lib/models/discount.model";
import UsedDiscount from "@/lib/models/usedDiscount.model";
import Products from "@/lib/models/product.model";
import ParentCategory from "@/lib/models/parentCategory.model";

import { revalidatePath } from "next/cache";
import { CacheService } from "@/services/cache.service";

export class DiscountService {
  // Create discount (works for both vendor and admin)
  static async createDiscount(
    data: Partial<IDiscount> & { parentCategoryId?: string; vendorId?: string },
    isAdmin: boolean = false
  ): Promise<ActionResponse<IDiscount>> {
    try {
      await connectToDB();

      // Validate parent category exists
      if (data.parentCategoryId && !data.parentCategory) {
        const parentCategory = await ParentCategory.findById(
          data.parentCategoryId
        );
        if (!parentCategory) {
          return { success: false, message: "Parent category not found" };
        }
      }

      // Prepare discount data
      const discountData = {
        ...data,
        targetType: data.targetType || DiscountTargetType.CATEGORY,
        parentCategory: data.parentCategoryId || data.parentCategory,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Remove parentCategoryId if it exists (use parentCategory instead)
      if (discountData.parentCategoryId) {
        delete discountData.parentCategoryId;
      }

      const discount = new Discount(discountData);
      await discount.save();

      const populateConfig = [
        { path: "parentCategory", select: "name isActive" },
        { path: "createdBy", select: "name email" },
      ];

      const populated = await Discount.findById(discount._id)
        .populate(populateConfig)
        .lean();

      const transformedDiscount = this.transformDiscount(populated, isAdmin);

      // Invalidate related caches
      await this.invalidateDiscountCaches(data.vendorId);

      // Revalidate paths based on context
      if (isAdmin) {
        revalidatePath("/admin/discounts");
      } else {
        revalidatePath("/vendor/discount");
      }

      return {
        success: true,
        data: transformedDiscount,
        message: "Discount created successfully",
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to create discount",
      };
    }
  }

  // Update discount (works for both vendor and admin)
  static async updateDiscount(
    id: string,
    data: Partial<IDiscount> & { parentCategoryId?: string; vendorId?: string },
    isAdmin: boolean = false
  ): Promise<ActionResponse<IDiscount>> {
    try {
      await connectToDB();

      // Check if discount exists
      const existingDiscount = await Discount.findById(id);
      if (!existingDiscount) {
        return { success: false, message: "Discount not found" };
      }

      // Validate parent category if provided
      if (data.parentCategoryId) {
        const parentCategory = await ParentCategory.findById(
          data.parentCategoryId
        );
        if (!parentCategory) {
          return { success: false, message: "Parent category not found" };
        }
      }

      // Prepare update data
      const updateData: any = {
        ...data,
        updatedAt: new Date(),
      };

      // If parentCategoryId is provided, map it to parentCategory field
      if (data.parentCategoryId) {
        updateData.parentCategory = data.parentCategoryId;
        delete updateData.parentCategoryId;
      }

      const populateConfig = [
        { path: "parentCategory", select: "name isActive" },
        { path: "createdBy", select: "name email" },
      ];

      const updated = await Discount.findByIdAndUpdate(id, updateData, {
        new: true,
      })
        .populate(populateConfig)
        .lean();

      if (!updated) {
        return { success: false, message: "Failed to update discount" };
      }

      const transformedDiscount = this.transformDiscount(updated, isAdmin);

      // Invalidate related caches
      const vendorId = data.vendorId || (updated && (updated as any).vendorId);
      await this.invalidateDiscountCaches(vendorId, id);

      // Revalidate paths based on context
      if (isAdmin) {
        revalidatePath("/admin/discounts");
      } else {
        revalidatePath("/vendor/discount");
      }

      return {
        success: true,
        data: transformedDiscount,
        message: "Discount updated successfully",
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to update discount",
      };
    }
  }

  // Get discount by ID (works for both vendor and admin)
  static async getDiscountById(
    id: string,
    isAdmin: boolean = false
  ): Promise<ActionResponse<IDiscount>> {
    try {
      // Add cache check
      const cacheKey = `discount:${id}:${isAdmin ? "admin" : "vendor"}`;
      const cached = await CacheService.get<IDiscount>(cacheKey);

      if (cached) {
        return {
          success: true,
          data: cached,
          message: "Discount fetched from cache",
        };
      }

      await connectToDB();

      const populateConfig = [
        { path: "parentCategory", select: "name isActive" },
        { path: "createdBy", select: "name email" },
      ];

      const discount = await Discount.findById(id)
        .populate(populateConfig)
        .lean();

      if (!discount) {
        return { success: false, message: "Discount not found" };
      }

      const transformedDiscount = this.transformDiscount(discount, isAdmin);

      // Cache the result
      await CacheService.set(cacheKey, transformedDiscount, 300); // 5 minutes TTL

      return {
        success: true,
        data: transformedDiscount,
        message: "Discount fetched successfully",
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to fetch discount",
      };
    }
  }

  // Get all discounts with pagination (admin only)
  static async getAllDiscounts(
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<IDiscount>> {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        sortBy = "createdAt",
        sortOrder = "desc",
      } = params;

      // Create cache key based on params
      const cacheKey = `discounts:all:admin:${JSON.stringify(params)}`;
      const cached = await CacheService.get<PaginatedResponse<IDiscount>>(
        cacheKey
      );

      if (cached) {
        return {
          ...cached,
          success: true,
        };
      }

      await connectToDB();

      // Build search query
      const searchQuery: any = {};
      if (search) {
        searchQuery.$or = [
          { name: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ];
      }

      // Build sort object
      const sortObject: any = {};
      sortObject[sortBy] = sortOrder === "desc" ? -1 : 1;

      const populateConfig = [
        { path: "parentCategory", select: "name isActive" },
        { path: "createdBy", select: "name email" },
      ];

      // Get total count
      const totalItems = await Discount.countDocuments(searchQuery);

      // Calculate pagination
      const totalPages = Math.ceil(totalItems / limit);
      const skip = (page - 1) * limit;

      // Get paginated results
      const discounts = await Discount.find(searchQuery)
        .populate(populateConfig)
        .sort(sortObject)
        .skip(skip)
        .limit(limit)
        .lean();

      const transformedDiscounts = discounts.map((d) =>
        this.transformDiscount(d, true)
      );

      const pagination: PaginationInfo = {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      };

      const result = {
        success: true,
        data: transformedDiscounts,
        pagination,
      };

      // Cache the result
      await CacheService.set(cacheKey, result, 300); // 5 minutes TTL

      return result;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch discounts",
      };
    }
  }

  // Get vendor discounts with pagination (vendor specific)
  static async getVendorDiscounts(
    vendorId: string,
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<IDiscount>> {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        sortBy = "createdAt",
        sortOrder = "desc",
      } = params;

      // Create cache key based on params
      const cacheKey = `discounts:vendor:${vendorId}:${JSON.stringify(params)}`;
      const cached = await CacheService.get<PaginatedResponse<IDiscount>>(
        cacheKey
      );

      if (cached) {
        return {
          ...cached,
          success: true,
        };
      }

      await connectToDB();

      // Build search query
      const searchQuery: any = { vendorId };
      if (search) {
        searchQuery.$or = [
          { name: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ];
      }

      // Build sort object
      const sortObject: any = {};
      sortObject[sortBy] = sortOrder === "desc" ? -1 : 1;

      const populateConfig = [
        { path: "parentCategory", select: "name isActive" },
        { path: "createdBy", select: "name email" },
      ];

      // Get total count
      const totalItems = await Discount.countDocuments(searchQuery);

      // Calculate pagination
      const totalPages = Math.ceil(totalItems / limit);
      const skip = (page - 1) * limit;

      // Get paginated results
      const discounts = await Discount.find(searchQuery)
        .populate(populateConfig)
        .sort(sortObject)
        .skip(skip)
        .limit(limit)
        .lean();

      const transformedDiscounts = discounts.map((d) =>
        this.transformDiscount(d, false)
      );

      const pagination: PaginationInfo = {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      };

      const result = {
        success: true,
        data: transformedDiscounts,
        pagination,
      };

      // Cache the result
      await CacheService.set(cacheKey, result, 300); // 5 minutes TTL

      return result;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch vendor discounts",
      };
    }
  }

  // Get public discounts (active discounts for public use) - NO PAGINATION
  static async getPublicDiscounts(): Promise<ActionResponse<IDiscount[]>> {
    try {
      // Add cache check
      const cacheKey = `discounts:public`;
      const cached = await CacheService.get<IDiscount[]>(cacheKey);

      if (cached) {
        return {
          success: true,
          data: cached,
          message: "Public discounts fetched from cache",
        };
      }

      await connectToDB();
      const currentDate = new Date();

      const populateConfig = [
        { path: "parentCategory", select: "name isActive" },
        { path: "createdBy", select: "name email" },
      ];

      const discounts = await Discount.find({
        isActive: true,
        startDate: { $lte: currentDate },
        endDate: { $gte: currentDate },
      })
        .populate(populateConfig)
        .sort({ createdAt: -1 })
        .lean();

      const transformedDiscounts = discounts.map((d) =>
        this.transformDiscount(d, false)
      );

      // Cache the result with shorter TTL since it's time-sensitive
      await CacheService.set(cacheKey, transformedDiscounts, 180); // 3 minutes TTL

      return {
        success: true,
        data: transformedDiscounts,
        message: "Public discounts fetched successfully",
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch public discounts",
      };
    }
  }

  // Get active discounts for a specific category
  static async getCategoryDiscounts(categoryId: string): Promise<{
    success: boolean;
    discounts?: Array<{
      id: string;
      name: string;
      discountType: DiscountType;
      discountValue: number;
    }>;
    error?: string;
  }> {
    try {
      await connectToDB();
      const now = new Date();

      const discounts = await Discount.find({
        parentCategory: categoryId,
        targetType: DiscountTargetType.CATEGORY,
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gt: now },
      }).sort({ discountValue: -1 });

      return {
        success: true,
        discounts: discounts.map((d) => ({
          id: d._id.toString(),
          name: d.name,
          discountType: d.discountType,
          discountValue: d.discountValue,
        })),
      };
    } catch (error) {
      console.error("Get category discounts error:", error);
      return {
        success: false,
        error: "Failed to fetch category discounts",
      };
    }
  }

  // Validate discount for order processing
  static async validateDiscount(
    code: string,
    items: Array<{ productId: string; price: number; quantity: number }>,
    userId: string,
    deliveryCharges: number = 0,
    rewardDiscountAmount: number = 0
  ): Promise<ActionResponse<IDiscountValidation>> {
    try {
      await connectToDB();

      const discount = await Discount.findOne({
        name: code,
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() },
        isActive: true,
      }).populate("parentCategory");

      if (!discount) {
        return { success: false, message: "Invalid or expired discount code" };
      }

      const usedDiscount = await UsedDiscount.findOne({
        discountCode: code,
        userIds: userId,
      });

      if (usedDiscount) {
        return {
          success: false,
          message: "You have already used this discount code",
        };
      }

      const { applicableSubtotal, discountAmount, newTotal } =
        await this.calculateDiscountAmount(
          discount,
          items,
          deliveryCharges,
          rewardDiscountAmount
        );

      if (applicableSubtotal === 0) {
        return {
          success: false,
          message: "No eligible items for this discount",
        };
      }

      await UsedDiscount.findOneAndUpdate(
        { discountCode: code },
        {
          $addToSet: { userIds: userId },
          $setOnInsert: { discountCode: code, usedAt: new Date() },
        },
        { upsert: true }
      );

      return {
        success: true,
        data: {
          discount: this.transformDiscount(discount, false),
          discountAmount,
          applicableSubtotal,
          newTotal,
        },
        message: "Discount validated successfully",
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to validate discount",
      };
    }
  }

  // Delete discount (works for both vendor and admin)
  static async deleteDiscount(
    id: string,
    isAdmin: boolean = false
  ): Promise<ActionResponse<void>> {
    try {
      await connectToDB();

      const result = await Discount.findByIdAndDelete(id);
      if (!result) {
        return { success: false, message: "Discount not found" };
      }

      // Invalidate related caches
      await this.invalidateDiscountCaches(result.vendorId, id);

      // Revalidate paths based on context
      if (isAdmin) {
        revalidatePath("/admin/discounts");
      } else {
        revalidatePath("/vendor/discount");
      }

      return { success: true, message: "Discount deleted successfully" };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to delete discount",
      };
    }
  }

  // Utility function to calculate discounted price (based on MRP)
  static calculateDiscountedPrice(
    mrp: number,
    discountType: DiscountType,
    discountValue: number
  ): number {
    const normalizedMrp = Math.max(mrp || 0, 0);
    if (discountType === DiscountType.PERCENTAGE) {
      const validPercentage = Math.min(Math.max(discountValue, 0), 100);
      return normalizedMrp - (normalizedMrp * validPercentage) / 100;
    } else {
      return Math.max(normalizedMrp - (discountValue || 0), 0);
    }
  }

  // Private helper methods
  private static async calculateDiscountAmount(
    discount: any,
    items: Array<{ productId: string; price: number; quantity: number }>,
    deliveryCharges: number = 0,
    rewardDiscountAmount: number = 0
  ) {
    const categoryId = discount.parentCategory._id.toString();
    const products = await Products.find({
      _id: { $in: items.map((i) => i.productId) },
    });

    const subtotal = Math.round(
      items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    );

    const applicableSubtotal = Math.round(
      items.reduce((sum, item) => {
        const product = products.find(
          (p) => p._id.toString() === item.productId
        );
        if (product?.parentCategory.toString() === categoryId) {
          return sum + item.price * item.quantity;
        }
        return sum;
      }, 0)
    );

    let discountAmount = 0;
    if (discount.discountType === DiscountType.PERCENTAGE) {
      discountAmount = Math.round(
        (applicableSubtotal * discount.discountValue) / 100
      );
    } else {
      discountAmount = Math.min(discount.discountValue, applicableSubtotal);
    }

    const newTotal = Math.round(
      subtotal + deliveryCharges - discountAmount - rewardDiscountAmount
    );

    return {
      applicableSubtotal,
      discountAmount: Math.round(discountAmount),
      newTotal,
    };
  }

  private static transformDiscount(
    discount: any,
    isAdmin: boolean = false
  ): IDiscount {
    const baseTransform = {
      id: discount._id.toString(),
      _id: discount._id.toString(),
      name: discount.name,
      description: discount.description,
      discountType: discount.discountType,
      discountValue: discount.discountValue,
      targetType: discount.targetType,
      parentCategory: discount.parentCategory
        ? {
            _id: discount.parentCategory._id?.toString() ?? "",
            name: discount.parentCategory.name ?? "",
            isActive: !!discount.parentCategory.isActive,
          }
        : { _id: "", name: "", isActive: false },
      startDate: discount.startDate,
      endDate: discount.endDate,
      isActive: discount.isActive,
      createdAt: discount.createdAt,
      updatedAt: discount.updatedAt,
    };

    // For admin, include all fields including vendorId and createdBy
    if (isAdmin) {
      return {
        ...baseTransform,
        vendorId: discount.vendorId?.toString(),
        createdBy: discount.createdBy
          ? {
              _id: discount.createdBy._id.toString(),
              name: discount.createdBy.name,
              email: discount.createdBy.email,
            }
          : undefined,
      };
    }

    // For vendor, include vendorId and createdBy
    return {
      ...baseTransform,
      vendorId: discount.vendorId?.toString(),
      createdBy: discount.createdBy
        ? {
            _id: discount.createdBy._id.toString(),
            name: discount.createdBy.name,
            email: discount.createdBy.email,
          }
        : undefined,
    };
  }

  private static async invalidateDiscountCaches(
    vendorId?: string,
    discountId?: string
  ): Promise<void> {
    try {
      const keysToDelete = [];

      // Always invalidate public discounts cache
      keysToDelete.push(`discounts:public`);

      // Invalidate all admin pagination caches (pattern-based deletion)
      const adminPattern = `discounts:all:admin:*`;
      keysToDelete.push(adminPattern);

      // Invalidate vendor-specific pagination caches if vendorId provided
      if (vendorId) {
        const vendorPattern = `discounts:vendor:${vendorId}:*`;
        keysToDelete.push(vendorPattern);
      }

      // Invalidate specific discount cache if discountId provided
      if (discountId) {
        keysToDelete.push(`discount:${discountId}:admin`);
        keysToDelete.push(`discount:${discountId}:vendor`);
      }

      // Delete all keys (implement pattern-based deletion in your CacheService)
      await Promise.all(keysToDelete.map((key) => CacheService.delete(key)));
    } catch (error) {
      console.error("Cache invalidation error:", error);
      // Fallback: clear all discount-related caches
      await CacheService.delete("discounts:*");
      await CacheService.delete("discount:*");
    }
  }
}

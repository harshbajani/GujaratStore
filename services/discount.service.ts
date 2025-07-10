/* eslint-disable @typescript-eslint/no-explicit-any */
import { connectToDB } from "@/lib/mongodb";
import Discount, { DiscountType } from "@/lib/models/discount.model";
import UsedDiscount from "@/lib/models/usedDiscount.model";
import Products from "@/lib/models/product.model";
import { CacheService } from "./cache.service";

export class DiscountService {
  static async createDiscount(
    data: Partial<IDiscount>
  ): Promise<ActionResponse<IDiscount>> {
    try {
      await connectToDB();
      const discount = new Discount(data);
      await discount.save();
      const populated = await Discount.findById(discount._id)
        .populate("parentCategory", "name isActive")
        .populate("createdBy", "name email")
        .lean();

      const transformedDiscount = this.transformDiscount(populated);

      // Invalidate related caches
      await this.invalidateDiscountCaches(data.vendorId);

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

  static async updateDiscount(
    id: string,
    data: Partial<IDiscount>
  ): Promise<ActionResponse<IDiscount>> {
    try {
      await connectToDB();
      const updated = await Discount.findByIdAndUpdate(id, data, { new: true })
        .populate("parentCategory", "name isActive")
        .populate("createdBy", "name email")
        .lean();

      if (!updated) return { success: false, message: "Discount not found" };

      const transformedDiscount = this.transformDiscount(updated);

      // Invalidate related caches
      await this.invalidateDiscountCaches(data.vendorId, id);

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

  static async getDiscountById(id: string): Promise<ActionResponse<IDiscount>> {
    try {
      // Add cache check
      const cacheKey = `discount:${id}`;
      const cached = await CacheService.get<IDiscount>(cacheKey);

      if (cached) {
        return {
          success: true,
          data: cached,
          message: "Discount fetched from cache",
        };
      }

      await connectToDB();
      const discount = await Discount.findById(id)
        .populate("parentCategory", "name isActive")
        .populate("createdBy", "name email")
        .lean();

      if (!discount) return { success: false, message: "Discount not found" };

      const transformedDiscount = this.transformDiscount(discount);

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

  static async getVendorDiscounts(
    vendorId: string
  ): Promise<ActionResponse<IDiscount[]>> {
    try {
      // Add cache check
      const cacheKey = `discounts:vendor:${vendorId}`;
      const cached = await CacheService.get<IDiscount[]>(cacheKey);

      if (cached) {
        return {
          success: true,
          data: cached,
          message: "Discounts fetched from cache",
        };
      }

      await connectToDB();
      const discounts = await Discount.find({ vendorId })
        .populate("parentCategory", "name isActive")
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 })
        .lean();

      const transformedDiscounts = discounts.map(this.transformDiscount);

      // Cache the result
      await CacheService.set(cacheKey, transformedDiscounts, 300); // 5 minutes TTL

      return {
        success: true,
        data: transformedDiscounts,
        message: "Discounts fetched successfully",
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to fetch discounts",
      };
    }
  }

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

      const discounts = await Discount.find({
        isActive: true,
        startDate: { $lte: currentDate },
        endDate: { $gte: currentDate },
      })
        .populate("parentCategory", "name isActive")
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 })
        .lean();

      const transformedDiscounts = discounts.map(this.transformDiscount);

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

  static async validateDiscount(
    code: string,
    items: Array<{ productId: string; price: number; quantity: number }>,
    userId: string,
    // Add optional parameters for total calculation
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

      if (!discount)
        return { success: false, message: "Invalid or expired discount code" };

      const usedDiscount = await UsedDiscount.findOne({
        discountCode: code,
        userIds: userId,
      });
      if (usedDiscount)
        return {
          success: false,
          message: "You have already used this discount code",
        };

      const { applicableSubtotal, discountAmount, newTotal } =
        await this.calculateDiscountAmount(
          discount,
          items,
          deliveryCharges,
          rewardDiscountAmount
        );

      if (applicableSubtotal === 0)
        return {
          success: false,
          message: "No eligible items for this discount",
        };

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
          discount: this.transformDiscount(discount),
          discountAmount,
          applicableSubtotal,
          newTotal, // Include the calculated new total
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

  static async deleteDiscount(id: string): Promise<ActionResponse<void>> {
    try {
      await connectToDB();
      const result = await Discount.findByIdAndDelete(id);
      if (!result) return { success: false, message: "Discount not found" };

      // Invalidate related caches
      await this.invalidateDiscountCaches(result.vendorId, id);

      return { success: true, message: "Discount deleted successfully" };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to delete discount",
      };
    }
  }

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

    // Calculate subtotal from all items
    const subtotal = Math.round(
      items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    );

    // Calculate applicable subtotal (only items matching the discount category)
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

    // Calculate the new total: subtotal + delivery charges - discount amount - reward discount
    const newTotal = Math.round(
      subtotal + deliveryCharges - discountAmount - rewardDiscountAmount
    );

    return {
      applicableSubtotal,
      discountAmount: Math.round(discountAmount),
      newTotal,
    };
  }

  private static transformDiscount(discount: any): IDiscount {
    return {
      id: discount._id.toString(),
      _id: discount._id.toString(),
      name: discount.name,
      description: discount.description,
      discountType: discount.discountType,
      discountValue: discount.discountValue,
      targetType: discount.targetType,
      parentCategory: {
        _id: discount.parentCategory._id.toString(),
        name: discount.parentCategory.name,
        isActive: discount.parentCategory.isActive,
      },
      vendorId: discount.vendorId?.toString(),
      startDate: discount.startDate,
      endDate: discount.endDate,
      isActive: discount.isActive,
      createdBy: discount.createdBy
        ? {
            _id: discount.createdBy._id.toString(),
            name: discount.createdBy.name,
            email: discount.createdBy.email,
          }
        : undefined,
      createdAt: discount.createdAt,
      updatedAt: discount.updatedAt,
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

      // Invalidate vendor-specific cache if vendorId provided
      if (vendorId) {
        keysToDelete.push(`discounts:vendor:${vendorId}`);
      }

      // Invalidate specific discount cache if discountId provided
      if (discountId) {
        keysToDelete.push(`discount:${discountId}`);
      }

      // Delete all keys
      await Promise.all(keysToDelete.map((key) => CacheService.delete(key)));
    } catch (error) {
      console.error("Cache invalidation error:", error);
    }
  }
}

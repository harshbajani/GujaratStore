/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import mongoose, { HydratedDocument } from "mongoose";
import { revalidatePath } from "next/cache";
import Discount, {
  DiscountType,
  DiscountTargetType,
} from "../models/discount.model";
import ParentCategory from "../models/parentCategory.model";

// Helper function to serialize MongoDB documents
const serializeDocument = (
  doc: HydratedDocument<IDiscount>
): IDiscount | null => {
  if (!doc) return null;
  const serialized = doc.toJSON ? doc.toJSON() : doc;
  return {
    id: serialized._id.toString(),
    _id: serialized._id.toString(),
    name: serialized.name,
    description: serialized.description,
    discountType: serialized.discountType,
    discountValue: serialized.discountValue,
    targetType: serialized.targetType,
    parentCategory:
      typeof serialized.parentCategory === "object" &&
      serialized.parentCategory !== null
        ? {
            _id: serialized.parentCategory._id.toString(),
            name: serialized.parentCategory.name,
            isActive: serialized.parentCategory.isActive,
          }
        : serialized.parentCategory,
    vendorId: serialized.vendorId,
    startDate: serialized.startDate,
    endDate: serialized.endDate,
    isActive: serialized.isActive,
    createdBy: serialized.createdBy
      ? {
          _id: serialized.createdBy._id.toString(),
          name: serialized.createdBy.name,
          email: serialized.createdBy.email,
        }
      : undefined,
    createdAt: serialized.createdAt,
    updatedAt: serialized.updatedAt,
  };
};

export type DiscountResponse = {
  success: boolean;
  data?: IDiscount | IDiscount[] | null;
  error?: string;
};

export async function createDiscount(data: {
  name: string;
  vendorId: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  parentCategoryId: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdBy?: string;
}): Promise<DiscountResponse> {
  try {
    // Validate parent category exists
    if (!mongoose.Types.ObjectId.isValid(data.parentCategoryId)) {
      return {
        success: false,
        error: "Invalid parent category ID",
      };
    }

    const parentCategory = await ParentCategory.findById(data.parentCategoryId);
    if (!parentCategory) {
      return {
        success: false,
        error: "Parent category not found",
      };
    }

    // Create discount
    const discount = await Discount.create({
      name: data.name,
      vendorId: data.vendorId,
      description: data.description,
      discountType: data.discountType,
      discountValue: data.discountValue,
      targetType: DiscountTargetType.CATEGORY,
      parentCategory: data.parentCategoryId,
      startDate: data.startDate,
      endDate: data.endDate,
      isActive: data.isActive,
      createdBy: data.createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    revalidatePath("/vendor/discount");

    return {
      success: true,
      data: serializeDocument(discount),
    };
  } catch (error) {
    console.error("Create discount error:", error);
    return {
      success: false,
      error: "Failed to create discount",
    };
  }
}

export async function getAllDiscounts(): Promise<DiscountResponse> {
  try {
    const discounts = await Discount.find()
      .populate({ path: "parentCategory", select: "name isActive" })
      .sort({ createdAt: -1 });

    return {
      success: true,
      data: discounts
        .map(serializeDocument)
        .filter((disc): disc is IDiscount => disc !== null),
    };
  } catch (error) {
    console.error("Get discounts error:", error);
    return {
      success: false,
      error: "Failed to fetch discounts",
    };
  }
}

export async function getDiscountById(id: string): Promise<DiscountResponse> {
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return {
        success: false,
        error: "Invalid discount ID",
      };
    }

    const discount = await Discount.findById(id).populate({
      path: "parentCategory",
      select: "name isActive",
    });

    if (!discount) {
      return {
        success: false,
        error: "Discount not found",
      };
    }

    return {
      success: true,
      data: serializeDocument(discount),
    };
  } catch (error) {
    console.error("Get discount error:", error);
    return {
      success: false,
      error: "Failed to fetch discount",
    };
  }
}

export async function updateDiscount(
  id: string,
  data: {
    name?: string;
    vendorId: string;
    description?: string;
    discountType?: DiscountType;
    discountValue?: number;
    parentCategoryId?: string;
    startDate?: Date;
    endDate?: Date;
    isActive?: boolean;
  }
): Promise<DiscountResponse> {
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return {
        success: false,
        error: "Invalid discount ID",
      };
    }

    // Check if discount exists
    const existingDiscount = await Discount.findById(id);
    if (!existingDiscount) {
      return {
        success: false,
        error: "Discount not found",
      };
    }

    // Validate parent category if provided
    if (data.parentCategoryId) {
      if (!mongoose.Types.ObjectId.isValid(data.parentCategoryId)) {
        return {
          success: false,
          error: "Invalid parent category ID",
        };
      }

      const parentCategory = await ParentCategory.findById(
        data.parentCategoryId
      );
      if (!parentCategory) {
        return {
          success: false,
          error: "Parent category not found",
        };
      }
    }

    // Update discount
    const updateData: any = {
      ...data,
      updatedAt: new Date(),
    };

    // If parentCategoryId is provided, map it to parentCategory field
    if (data.parentCategoryId) {
      updateData.parentCategory = data.parentCategoryId;
      delete updateData.parentCategoryId;
    }

    const updatedDiscount = await Discount.findByIdAndUpdate(id, updateData, {
      new: true,
    }).populate({ path: "parentCategory", select: "name isActive" });

    if (!updatedDiscount) {
      return {
        success: false,
        error: "Failed to update discount",
      };
    }

    revalidatePath("/vendor/discount");

    return {
      success: true,
      data: serializeDocument(updatedDiscount),
    };
  } catch (error) {
    console.error("Update discount error:", error);
    return {
      success: false,
      error: "Failed to update discount",
    };
  }
}

export async function deleteDiscount(id: string): Promise<DiscountResponse> {
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return {
        success: false,
        error: "Invalid discount ID",
      };
    }

    const discount = await Discount.findByIdAndDelete(id);

    if (!discount) {
      return {
        success: false,
        error: "Discount not found",
      };
    }

    revalidatePath("/vendor/discount");

    return {
      success: true,
      data: serializeDocument(discount),
    };
  } catch (error) {
    console.error("Delete discount error:", error);
    return {
      success: false,
      error: "Failed to delete discount",
    };
  }
}

// Utility function to apply discount to a product price
export function calculateDiscountedPrice(
  basePrice: number,
  discountType: DiscountType,
  discountValue: number
): number {
  if (discountType === DiscountType.PERCENTAGE) {
    // Ensure discount percentage is within valid range
    const validPercentage = Math.min(Math.max(discountValue, 0), 100);
    return basePrice - (basePrice * validPercentage) / 100;
  } else {
    // For fixed amount discount, ensure it doesn't make price negative
    return Math.max(basePrice - discountValue, 0);
  }
}

// Get active discounts for a specific category
export async function getCategoryDiscounts(categoryId: string): Promise<{
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
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return {
        success: false,
        error: "Invalid category ID",
      };
    }

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

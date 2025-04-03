"use server";

import mongoose, { HydratedDocument, Schema } from "mongoose";
import { revalidatePath } from "next/cache";
import { parentCategorySchema } from "../validations";
import ParentCategory from "../models/parentCategory.model";
import { getCurrentVendor } from "./vendor.actions";

export interface IParentCategory {
  id: string;
  _id: string;
  name: string;
  vendorId: Schema.Types.ObjectId;
  isActive: boolean;
}

// Helper function to serialize MongoDB documents
const serializeDocument = (doc: HydratedDocument<IParentCategory>) => {
  if (!doc) return null;
  const serialized = doc.toJSON ? doc.toJSON() : doc;
  return {
    id: serialized._id.toString(),
    _id: serialized._id.toString(),
    name: (serialized as IParentCategory).name,
    vendorId: serialized.vendorId,
    isActive: (serialized as IParentCategory).isActive,
  };
};

export type ParentCategoryResponse = {
  success: boolean;
  data?: IParentCategory | IParentCategory[] | null;
  error?: string;
};

export async function createParentCategory(
  name: string,
  vendorId: string,
  isActive: boolean
): Promise<ParentCategoryResponse> {
  try {
    const validation = parentCategorySchema.safeParse({
      name,
      vendorId,
      isActive,
    });

    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors[0].message,
      };
    }

    const existingParentCategory = await ParentCategory.findOne({ name });
    if (existingParentCategory) {
      return {
        success: false,
        error: "Parent Category with this name already exists",
      };
    }

    const parentCategory = await ParentCategory.create({
      name,
      vendorId,
      isActive,
    });
    revalidatePath("/vendor/category/parentCategory");

    return {
      success: true,
      data: serializeDocument(parentCategory),
    };
  } catch (error) {
    console.error("Create parent category error:", error);
    return {
      success: false,
      error: "Failed to create parent category",
    };
  }
}

export async function getAllParentCategory(): Promise<ParentCategoryResponse> {
  try {
    const vendorResponse = await getCurrentVendor();

    if (!vendorResponse.success) {
      return {
        success: false,
        error: "Not authenticated as vendor",
        data: [],
      };
    }

    const vendorId = vendorResponse.data?._id;
    const parentCategory = await ParentCategory.find({ vendorId }).sort({
      name: 1,
    });
    return {
      success: true,
      data: parentCategory
        .map(serializeDocument)
        .filter((attr): attr is IParentCategory => attr !== null),
    };
  } catch (error) {
    console.error("Get parent category error:", error);
    return {
      success: false,
      error: "Failed to fetch parent category",
    };
  }
}

export async function getParentCategoryById(
  id: string
): Promise<ParentCategoryResponse> {
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return {
        success: false,
        error: "Invalid parentCategoryID",
      };
    }

    const parentCategory = await ParentCategory.findById(id);
    if (!parentCategory) {
      return {
        success: false,
        error: "Parent category not found",
      };
    }

    return {
      success: true,
      data: serializeDocument(parentCategory),
    };
  } catch (error) {
    console.error("Get parent category error:", error);
    return {
      success: false,
      error: "Failed to fetch parent category",
    };
  }
}

export async function updateParentCategory(
  id: string,
  data: { name: string; vendorId: string; isActive: boolean }
): Promise<ParentCategoryResponse> {
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return {
        success: false,
        error: "Invalid parentCategoryID",
      };
    }

    const updatedParentCategory = await ParentCategory.findByIdAndUpdate(
      id,
      {
        name: data.name,
        vendorId: data.vendorId,
        isActive: data.isActive,
      },
      { new: true } // Returns updated document
    );

    if (!updatedParentCategory) {
      return {
        success: false,
        error: "Parent category not found",
      };
    }

    revalidatePath("/vendor/category/parentCategory");
    return {
      success: true,
      data: serializeDocument(updatedParentCategory),
    };
  } catch (error) {
    console.error("Update parent category error:", error);
    return {
      success: false,
      error: "Failed to update parent category",
    };
  }
}

export async function deleteParentCategory(
  id: string
): Promise<ParentCategoryResponse> {
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return {
        success: false,
        error: "Invalid parentCategoryID",
      };
    }

    const parentCategory = await ParentCategory.findByIdAndDelete(id);

    if (!parentCategory) {
      return {
        success: false,
        error: "Parent category not found",
      };
    }

    revalidatePath("/vendor/category/parentCategory");
    return {
      success: true,
      data: serializeDocument(parentCategory),
    };
  } catch (error) {
    console.error("Delete parent category error:", error);
    return {
      success: false,
      error: "Failed to delete parent category",
    };
  }
}

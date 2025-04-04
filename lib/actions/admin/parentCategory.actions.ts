"use server";

import mongoose, { HydratedDocument } from "mongoose";
import { revalidatePath } from "next/cache";
import { parentCategorySchema } from "../../validations";
import ParentCategory from "../../models/parentCategory.model";

export interface IParentCategory {
  id: string;
  _id: string;
  name: string;
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
  isActive: boolean
): Promise<ParentCategoryResponse> {
  try {
    const validation = parentCategorySchema.safeParse({ name, isActive });

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

    const parentCategory = await ParentCategory.create({ name, isActive });
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
    const parentCategory = await ParentCategory.find().sort({ name: 1 });
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
  data: { name: string; isActive: boolean }
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

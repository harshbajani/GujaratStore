"use server";

import { revalidatePath } from "next/cache";
import Attributes from "@/lib/models/attribute.model";
import mongoose from "mongoose";
import { z } from "zod";
import { getCurrentVendor } from "./vendor.actions";

// Define the attribute interface
export interface IAttribute {
  id: string;
  _id: string;
  name: string;
  isActive: boolean;
}

// Helper function to serialize MongoDB documents
const serializeDocument = (doc: mongoose.Document): IAttribute | null => {
  if (!doc) return null;
  const serialized = doc.toJSON ? doc.toJSON() : doc;
  return {
    id: serialized._id.toString(),
    _id: serialized._id.toString(),
    name: (serialized as IAttribute).name,
    isActive: (serialized as IAttribute).isActive,
  };
};

// Validation schema
const attributeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  isActive: z.boolean().default(true),
});

export type AttributeResponse = {
  success: boolean;
  data?: IAttribute | IAttribute[] | null;
  error?: string;
};

export async function createAttribute(
  name: string,
  isActive: boolean
): Promise<AttributeResponse> {
  try {
    // Get the current vendor first
    const vendorResponse = await getCurrentVendor();

    if (!vendorResponse.success) {
      return {
        success: false,
        error: "Not authenticated as vendor",
      };
    }

    const validation = attributeSchema.safeParse({ name, isActive });

    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors[0].message,
      };
    }

    const existingAttribute = await Attributes.findOne({ name });

    if (existingAttribute) {
      return {
        success: false,
        error: "Attribute with this name already exists for this vendor",
      };
    }

    const attribute = await Attributes.create({
      name,
      isActive,
    });

    revalidatePath("/vendor/attribute");

    return {
      success: true,
      data: serializeDocument(attribute),
    };
  } catch (error) {
    console.error("Create attribute error:", error);
    return {
      success: false,
      error: "Failed to create attribute",
    };
  }
}

export async function getAllAttributes(): Promise<AttributeResponse> {
  try {
    const attributes = await Attributes.find({}).sort({ name: 1 });

    return {
      success: true,
      data: attributes
        .map(serializeDocument)
        .filter((attr): attr is IAttribute => attr !== null),
    };
  } catch (error) {
    console.error("Get attributes error:", error);
    return {
      success: false,
      error: "Failed to fetch attributes",
    };
  }
}

export async function getAttributeById(id: string): Promise<AttributeResponse> {
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return {
        success: false,
        error: "Invalid attribute ID",
      };
    }

    const attribute = await Attributes.findById(id);
    if (!attribute) {
      return {
        success: false,
        error: "Attribute not found",
      };
    }

    return {
      success: true,
      data: serializeDocument(attribute),
    };
  } catch (error) {
    console.error("Get attribute error:", error);
    return {
      success: false,
      error: "Failed to fetch attribute",
    };
  }
}

// Add this after other attribute actions
export async function updateAttribute(
  id: string,
  data: { name: string; isActive: boolean }
): Promise<AttributeResponse> {
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return {
        success: false,
        error: "Invalid attribute ID",
      };
    }

    // First check if attribute exists
    const existingAttribute = await Attributes.findById(id);

    if (!existingAttribute) {
      return {
        success: false,
        error: "Attribute not found",
      };
    }

    // Update the attribute with the current vendor's ID
    const updatedAttribute = await Attributes.findByIdAndUpdate(
      id,
      {
        name: data.name,
        isActive: data.isActive,
      },
      { new: true }
    );

    if (!updatedAttribute) {
      return {
        success: false,
        error: "Failed to update attribute",
      };
    }

    revalidatePath("/vendor/attribute");

    return {
      success: true,
      data: serializeDocument(updatedAttribute),
    };
  } catch (error) {
    console.error("Update attribute error:", error);
    return {
      success: false,
      error: "Failed to update attribute",
    };
  }
}

export async function deleteAttribute(id: string): Promise<AttributeResponse> {
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return {
        success: false,
        error: "Invalid attribute ID",
      };
    }

    const attribute = await Attributes.findByIdAndDelete(id);

    if (!attribute) {
      return {
        success: false,
        error: "Attribute not found",
      };
    }

    revalidatePath("/vendor/attribute");
    return {
      success: true,
      data: serializeDocument(attribute),
    };
  } catch (error) {
    console.error("Delete attribute error:", error);
    return {
      success: false,
      error: "Failed to delete attribute",
    };
  }
}

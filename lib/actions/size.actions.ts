"use server";

import Size, { ISize } from "@/lib/models/size.model";

export type SizeResponse = {
  success: boolean;
  data?: object;
  error?: string;
};

// Helper function to serialize MongoDB documents into plain objects
const serializeSize = (doc: ISize | null): object | null => {
  if (!doc) return null;
  // Convert document to a plain object if necessary
  const serialized = doc.toJSON ? doc.toJSON() : doc;
  return {
    id: serialized._id.toString(),
    _id: serialized._id.toString(),
    label: serialized.label,
    value: serialized.value,
    isActive: serialized.isActive,
  };
};

export async function createSize(
  label: string,
  value: string,

  isActive: boolean = true
): Promise<SizeResponse> {
  try {
    const size = new Size({ label, value, isActive });
    const savedSize = await size.save();
    return { success: true, data: serializeSize(savedSize)! };
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Unknown error" };
  }
}

export async function getSizeById(id: string): Promise<SizeResponse> {
  try {
    const size = await Size.findById(id);
    if (!size) {
      return { success: false, error: "Size not found" };
    }
    return { success: true, data: serializeSize(size)! };
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Unknown error" };
  }
}

export async function getAllSizes(): Promise<SizeResponse> {
  try {
    const sizes = await Size.find({});
    const plainSizes = sizes.map((s) => serializeSize(s));
    return { success: true, data: plainSizes };
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Unknown error" };
  }
}

export async function updateSize(
  id: string,
  data: { label?: string; value?: string; isActive?: boolean }
): Promise<SizeResponse> {
  try {
    const size = await Size.findByIdAndUpdate(id, data, { new: true });
    if (!size) {
      return { success: false, error: "Size not found" };
    }
    return { success: true, data: serializeSize(size)! };
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Unknown error" };
  }
}

export async function deleteSize(id: string): Promise<SizeResponse> {
  try {
    const size = await Size.findByIdAndDelete(id);
    if (!size) {
      return { success: false, error: "Size not found" };
    }
    return { success: true, data: serializeSize(size)! };
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Unknown error" };
  }
}

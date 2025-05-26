"use server";

import { connectToDB } from "../mongodb";
import { brandSchema } from "../validations";
import Brand from "../models/brand.model";
import { Types } from "mongoose";
import { z } from "zod";
import { getFileById } from "./files.actions";

type BrandFormData = z.infer<typeof brandSchema>;

export interface BrandResponse {
  success: boolean;
  data?: IBrand[];
  error?: string;
}

export async function createBrand(data: BrandFormData) {
  try {
    await connectToDB();
    const validatedData = brandSchema.parse(data);
    const brand = await Brand.create({ ...validatedData });
    return { success: true, brand };
  } catch (error) {
    console.log("Brand creation failed", error);
    throw new Error("Brand creation failed");
  }
}

export async function getAllBrands(): Promise<BrandResponse> {
  try {
    await connectToDB();
    const brands = await Brand.find({}).sort({ createdAt: -1 }).lean().exec();

    const transformedBrands = await Promise.all(
      brands.map(async (brand) => {
        const image = await getFileById(brand.imageId);
        return {
          ...brand,
          _id: (brand._id as Types.ObjectId).toString(),
          name: brand.name,
          imageId: image.buffer.toString("base64"),
          metaTitle: brand.metaTitle,
          metaKeywords: brand.metaKeywords,
          metaDescription: brand.metaDescription,
        };
      })
    );

    return {
      success: true,
      data: transformedBrands,
    };
  } catch (error) {
    console.error("Error fetching brands", error);
    return {
      success: false,
      error: "Error fetching brands",
      data: [],
    };
  }
}

export async function getBrandById(id: string): Promise<IBrand | null> {
  try {
    await connectToDB();

    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    const brand = (await Brand.findById(id)) as IBrand | null;

    if (!brand) {
      return null;
    }
    const image = await getFileById(brand.imageId);
    const transformedBrand = {
      name: brand.name,
      imageId: image.buffer.toString("base64"),
      metaTitle: brand.metaTitle,
      metaKeywords: brand.metaKeywords,
      metaDescription: brand.metaDescription,
    };
    return transformedBrand;
  } catch (error) {
    console.log("Error fetching brand by id", error);
    throw new Error("Error fetching brand by id");
  }
}

export async function deleteBrand(id: string) {
  try {
    await connectToDB();
    const deletedBrand = await Brand.findByIdAndDelete(id).lean();
    if (!deletedBrand) {
      throw new Error("Brand not found");
    }
    return deleteBrand;
  } catch (error) {
    console.log("Error deleting brand", error);
    throw new Error("Error deleting brand");
  }
}

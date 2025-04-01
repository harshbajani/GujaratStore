"use server";

import { connectToDB } from "../mongodb";
import { brandSchema } from "../validations";
import Brand from "../models/brand.model";
import { ObjectId } from "mongodb";
import { IBrand } from "@/types";
import { Types } from "mongoose";
import { z } from "zod";
import { getCurrentVendor } from "./vendor.actions";

type BrandFormData = z.infer<typeof brandSchema>;

export async function createBrand(data: BrandFormData, vendorId: string) {
  try {
    await connectToDB();
    const validatedData = brandSchema.parse(data);
    const brand = await Brand.create({ ...validatedData, vendorId });
    return { success: true, brand };
  } catch (error) {
    console.log("Brand creation failed", error);
    throw new Error("Brand creation failed");
  }
}

export async function getAllBrands() {
  try {
    await connectToDB();
    const vendorResponse = await getCurrentVendor();

    if (!vendorResponse.success) {
      return {
        success: false,
        error: "Not authenticated as vendor",
      };
    }

    const vendorId = vendorResponse.data?._id;
    const brands = await Brand.find({ vendorId })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
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
    return transformedBrands;
  } catch (error) {
    console.log("Error fetching brands", error);
    throw new Error("Error fetching brands");
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
      vendorId: brand.vendorId,
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

export async function getFileById(id: string) {
  try {
    const { bucket } = await connectToDB();

    const fileId = new ObjectId(id);

    // Get file info
    const files = await bucket.find({ _id: fileId }).toArray();
    if (!files.length) {
      throw new Error("File not found");
    }

    const file = files[0];

    // Create download stream
    const downloadStream = bucket.openDownloadStream(fileId);

    // Convert stream to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of downloadStream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Return file details and buffer
    return {
      buffer,
      contentType: file.contentType || "application/octet-stream",
      filename: file.filename,
    };
  } catch (error) {
    console.error("Error retrieving file:", error);
    throw new Error("Failed to retrieve file");
  }
}

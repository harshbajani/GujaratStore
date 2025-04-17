"use server";
import { z } from "zod";
import { HydratedDocument } from "mongoose";
import { connectToDB } from "@/lib/mongodb";
import PrimaryCategory from "@/lib/models/primaryCategory.model";

// Import referenced models for population
import { IAdminPrimaryCategory } from "@/types";
import { primaryCategorySchema } from "../../validations";
import ParentCategory from "@/lib/models/parentCategory.model";
import { parseStringify } from "../../utils";

// Define TypeScript interface for PrimaryCategory
export type PrimaryCategoryData = z.infer<typeof primaryCategorySchema>;

// Helper function to serialize MongoDB documents (to prevent serialize errors)
export const serializeDocument = async (
  doc: HydratedDocument<IAdminPrimaryCategory>
) => {
  return parseStringify(doc);
};

// * 1. Create Primary Category
export const createPrimaryCategory = async (data: PrimaryCategoryData) => {
  // Ensure database connection
  await connectToDB();

  // Validate incoming data
  const validatedData = primaryCategorySchema.parse(data);

  // Ensure ParentCategory and Attributes exist
  const parentCategoryExists = await ParentCategory.findById(
    validatedData.parentCategory
  );
  if (!parentCategoryExists) throw new Error("Parent category not found");

  const primaryCategory = new PrimaryCategory(validatedData);
  const savedCategory = await primaryCategory.save();

  return serializeDocument(savedCategory);
};

// * 2. Get All Primary Categories
export const getAllPrimaryCategories = async () => {
  await connectToDB();

  const primaryCategories = await PrimaryCategory.find().populate({
    path: "parentCategory",
    select: "name", // Explicitly select name field
  });

  // Ensure proper serialization
  return primaryCategories.map((category) => ({
    ...parseStringify(category), // Serialize
    id: category._id.toString(), // Ensure id is a string
  }));
};

// * 3. Get Primary Category by ID
export const getPrimaryCategoryById = async (id: string) => {
  // Ensure database connection
  await connectToDB();

  const primaryCategory = await PrimaryCategory.findById(id).populate(
    "parentCategory"
  );

  if (!primaryCategory) throw new Error("Primary category not found");

  return serializeDocument(primaryCategory);
};

// * 4. Update Primary Category by ID
export const updatePrimaryCategoryById = async (
  id: string,
  data: Partial<PrimaryCategoryData>
) => {
  // Ensure database connection
  await connectToDB();

  const validatedData = primaryCategorySchema.partial().parse(data);

  // Check if parentCategory exists, if provided
  if (validatedData.parentCategory) {
    const parentCategoryExists = await ParentCategory.findById(
      validatedData.parentCategory
    );
    if (!parentCategoryExists) throw new Error("Parent category not found");
  }

  const updatedCategory = await PrimaryCategory.findByIdAndUpdate(
    id,
    validatedData,
    {
      new: true, // Return the updated document
    }
  ).populate("parentCategory");

  if (!updatedCategory) throw new Error("Primary category not found");

  return serializeDocument(updatedCategory);
};

// * 5. Delete Primary Category by ID
export const deletePrimaryCategoryById = async (id: string) => {
  // Ensure database connection
  await connectToDB();

  const deletedCategory = await PrimaryCategory.findByIdAndDelete(id);

  if (!deletedCategory) throw new Error("Primary category not found");

  return serializeDocument(deletedCategory);
};

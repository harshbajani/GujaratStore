"use server";

import { z } from "zod";
import { connectToDB } from "../mongodb";
import { parseStringify } from "../utils";
import { HydratedDocument } from "mongoose";
import { ISecondaryCategory } from "@/types";
import { secondaryCategorySchema } from "../validations";
import ParentCategory from "../models/parentCategory.model";
import Attributes from "../models/attribute.model";
import PrimaryCategory from "../models/primaryCategory.model";
import SecondaryCategory from "../models/secondaryCategory.model";

export type SecondaryCategoryData = z.infer<typeof secondaryCategorySchema>;

export const serializeDocument = async (
  doc: HydratedDocument<ISecondaryCategory>
) => {
  return parseStringify(doc);
};

// * 1. Create Secondary Category
export const createSecondaryCategory = async (data: SecondaryCategoryData) => {
  // Ensure database connection
  await connectToDB();

  // Validate incoming data
  const validatedData = secondaryCategorySchema.parse(data);

  // Ensure ParentCategory and Attributes exist
  const parentCategoryExists = await ParentCategory.findById(
    validatedData.parentCategory
  );
  if (!parentCategoryExists) throw new Error("Parent category not found");

  const primaryCategoryExists = await PrimaryCategory.findById(
    validatedData.primaryCategory
  );
  if (!primaryCategoryExists) throw new Error("Primary category not found");

  const attributesExist = await Attributes.find({
    _id: { $in: validatedData.attributes },
  });
  if (attributesExist.length !== validatedData.attributes.length) {
    throw new Error("One or more attributes not found");
  }

  const secondaryCategory = new SecondaryCategory(validatedData);
  const savedCategory = await secondaryCategory.save();

  return serializeDocument(savedCategory);
};

// * 2. Get All Secondary Categories
export const getAllSecondaryCategories = async () => {
  await connectToDB();

  const secondaryCategory = await SecondaryCategory.find()
    .populate({
      path: "parentCategory",
      select: "name", // Explicitly select name field
    })
    .populate({
      path: "primaryCategory",
      select: "name", // Explicitly select name field
    })
    .populate({
      path: "attributes",
      select: "name", // Explicitly select name field
    });

  // Ensure proper serialization
  return secondaryCategory.map((category) => ({
    ...parseStringify(category), // Serialize
    id: category._id.toString(), // Ensure id is a string
  }));
};

// * 3. Get Secondary Category by ID
export const getSecondaryCategoryById = async (id: string) => {
  // Ensure database connection
  await connectToDB();

  const secondaryCategory = await SecondaryCategory.findById(id)
    .populate("parentCategory")
    .populate("primaryCategory")
    .populate("attributes");

  if (!secondaryCategory) throw new Error("Secondary category not found");

  return serializeDocument(secondaryCategory);
};

// * 4. Update Secondary Category by ID
export const updateSecondaryCategoryById = async (
  id: string,
  data: Partial<SecondaryCategoryData>
) => {
  // Ensure database connection
  await connectToDB();

  const validatedData = secondaryCategorySchema.partial().parse(data);

  // Check if parentCategory exists, if provided
  if (validatedData.parentCategory) {
    const parentCategoryExists = await ParentCategory.findById(
      validatedData.parentCategory
    );
    if (!parentCategoryExists) throw new Error("Parent category not found");
  }

  // Check if primaryCategory exists, if provided
  if (validatedData.primaryCategory) {
    const primaryCategoryExists = await PrimaryCategory.findById(
      validatedData.primaryCategory
    );
    if (!primaryCategoryExists) throw new Error("Primary category not found");
  }

  // Check if attributes exist, if provided
  if (validatedData.attributes) {
    const attributesExist = await Attributes.find({
      _id: { $in: validatedData.attributes },
    });
    if (attributesExist.length !== validatedData.attributes.length) {
      throw new Error("One or more attributes not found");
    }
  }

  const updatedCategory = await SecondaryCategory.findByIdAndUpdate(
    id,
    validatedData,
    {
      new: true, // Return the updated document
    }
  )
    .populate("parentCategory")
    .populate("primaryCategory")
    .populate("attributes");

  if (!updatedCategory) throw new Error("Secondary category not found");

  return serializeDocument(updatedCategory);
};

// * 5. Delete Secondary Category by ID
export const deleteSecondaryCategoryById = async (id: string) => {
  // Ensure database connection
  await connectToDB();

  const deletedCategory = await SecondaryCategory.findByIdAndDelete(id);

  if (!deletedCategory) throw new Error("Secondary category not found");

  return serializeDocument(deletedCategory);
};

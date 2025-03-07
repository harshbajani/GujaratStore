import Products from "@/lib/models/product.model";
import { connectToDB } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

export async function GET(request: NextRequest) {
  try {
    await connectToDB();
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");
    const limit = parseInt(searchParams.get("limit") || "5");

    if (!query) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Create a case-insensitive regex for the search term
    const searchRegex = new RegExp(query, "i");

    // First, find categories that match the search term
    const ParentCategory = mongoose.model("ParentCategory");
    const PrimaryCategory = mongoose.model("PrimaryCategory");
    const SecondaryCategory = mongoose.model("SecondaryCategory");

    // Find matching categories
    const [
      matchingParentCategories,
      matchingPrimaryCategories,
      matchingSecondaryCategories,
    ] = await Promise.all([
      ParentCategory.find({ name: searchRegex }).select("_id").lean(),
      PrimaryCategory.find({ name: searchRegex }).select("_id").lean(),
      SecondaryCategory.find({ name: searchRegex }).select("_id").lean(),
    ]);

    // Extract category IDs
    const parentCategoryIds = matchingParentCategories.map((cat) => cat._id);
    const primaryCategoryIds = matchingPrimaryCategories.map((cat) => cat._id);
    const secondaryCategoryIds = matchingSecondaryCategories.map(
      (cat) => cat._id
    );

    // Search for products that match either the query text or belong to matching categories
    const products = await Products.find({
      $or: [
        { productName: searchRegex }, // Match product name
        { "attributes.value": searchRegex }, // Match attribute values
        { productDescription: searchRegex }, // Match product description
        { parentCategory: { $in: parentCategoryIds } }, // Match parent category
        { primaryCategory: { $in: primaryCategoryIds } }, // Match primary category
        { secondaryCategory: { $in: secondaryCategoryIds } }, // Match secondary category
      ],
      productStatus: true, // Only include active products
    })
      .limit(limit)
      .select("_id productName productCoverImage parentCategory")
      .populate({ path: "parentCategory", select: "name" })
      .lean()
      .exec();

    return NextResponse.json({
      success: true,
      data: products,
    });
  } catch (error: unknown) {
    console.error("Error in search products:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

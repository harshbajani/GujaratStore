import { NextResponse } from "next/server";
import Products from "@/lib/models/product.model";
import { connectToDB } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectToDB();

    // Fetch the first 4 organic products
    const organicProducts = await Products.find({
      productStatus: true, // Only active products
    })
      .populate([
        { path: "parentCategory", select: "name" },
        { path: "primaryCategory", select: "name" },
        { path: "secondaryCategory", select: "name" },
        { path: "brands", select: "name" },
        { path: "productReviews", select: "rating" },
      ])
      .select(
        "productName slug parentCategory primaryCategory secondaryCategory brands productReviews productCoverImage mrp netPrice discountType discountValue productQuantity productStatus"
      )
      .lean();

    // Filter products that belong to organic category
    const filteredOrganicProducts = organicProducts
      .filter(
        (product) => product.parentCategory?.name?.toLowerCase() === "organic"
      )
      .slice(0, 4); // Get only first 4 products

    return NextResponse.json({
      success: true,
      data: filteredOrganicProducts,
    });
  } catch (error) {
    console.error("Error fetching featured organic products:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch organic products",
        data: [],
      },
      { status: 500 }
    );
  }
}

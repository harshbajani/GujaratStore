import { NextResponse } from "next/server";
import Products from "@/lib/models/product.model";
import { connectToDB } from "@/lib/mongodb";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const productIds = url.searchParams.get("ids")?.split(",") || [];

    if (productIds.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    await connectToDB();

    // Fetch the product details for each item in the guest wishlist
    const wishlistItems = await Products.find(
      { _id: { $in: productIds } },
      {
        productName: 1,
        productCoverImage: 1,
        mrp: 1,
        netPrice: 1,
        discountType: 1,
        discountValue: 1,
        productQuantity: 1,
        productStatus: 1,
      }
    ).lean();

    return NextResponse.json({ success: true, data: wishlistItems });
  } catch (error) {
    console.error("Error fetching guest wishlist items:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch wishlist items" },
      { status: 500 }
    );
  }
}

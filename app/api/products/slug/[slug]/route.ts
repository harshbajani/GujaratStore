import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import Products from "@/lib/models/product.model";

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await connectToDB();
    const slug = (await params).slug;

    const product = await Products.findOne({ slug })
      .populate([
        { path: "parentCategory", select: "name" },
        { path: "primaryCategory", select: "name" },
        { path: "secondaryCategory", select: "name" },
        { path: "brands", select: "name" },
        { path: "attributes.attributeId", select: "name" },
        { path: "productSize", select: "label" },
      ])
      .lean();

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: product });
  } catch (error: unknown) {
    console.error("Error in GET products by slug:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

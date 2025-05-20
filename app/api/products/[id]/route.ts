import Products from "@/lib/models/product.model";
import { connectToDB } from "@/lib/mongodb";

import { NextRequest, NextResponse } from "next/server";

// Populate configuration for reuse
const populateConfig = [
  { path: "parentCategory", select: "name" },
  { path: "primaryCategory", select: "name" },
  { path: "secondaryCategory", select: "name" },
  { path: "brands", select: "name" },
  { path: "attributes.attributeId", select: "name" },
  { path: "productSize", select: "label" },
];

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await connectToDB();
    const id = (await params).id;

    const product = await Products.findById(id)
      .populate(populateConfig)
      .lean()
      .exec();

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: product });
  } catch (error: unknown) {
    console.error("Error in GET products:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    await connectToDB();
    const body = await request.json();

    const updatedProduct = await Products.findByIdAndUpdate(body._id, body, {
      new: true,
    })
      .populate({ path: "parentCategory", select: "name _id" })
      .populate({ path: "primaryCategory", select: "name _id" })
      .populate({ path: "secondaryCategory", select: "name _id" })
      .populate({ path: "brands", select: "name _id" })
      .populate({ path: "attributes.attributeId", select: "value" })
      .populate({ path: "productSize", select: "label" });

    if (!updatedProduct) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updatedProduct });
  } catch (error: unknown) {
    console.error("Update error:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 400 }
    );
  }
}

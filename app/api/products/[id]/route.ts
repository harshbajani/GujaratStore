import Products from "@/lib/models/product.model";
import { connectToDB } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    await connectToDB();
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (id) {
      const product = await Products.findById(id)
        .populate({ path: "parentCategory", select: "name _id" }) // Add _id to select
        .populate({ path: "primaryCategory", select: "name _id" })
        .populate({ path: "secondaryCategory", select: "name _id" })
        .populate({ path: "brands", select: "name _id" })
        .populate({ path: "attributes.attributeId", select: "value" });

      if (!product) {
        return NextResponse.json(
          { success: false, error: "Product not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: product });
    }

    // ... rest of the code
  } catch (error: unknown) {
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
    });

    if (!updatedProduct) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updatedProduct });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 400 }
    );
  }
}

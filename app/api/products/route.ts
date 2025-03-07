import Products from "@/lib/models/product.model";
import { connectToDB } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";

// Commonly needed fields that we always want to retrieve
const commonFields =
  "productName parentCategory primaryCategory secondaryCategory brands productReviews productSize gender productQuantity attributes productStatus productSKU productColor productDescription productImages productCoverImage mrp basePrice discountType discountValue gstRate gstAmount netPrice productWarranty productReturnPolicy metaTitle metaKeywords metaDescription";

// Populate configuration for reuse
const populateConfig = [
  { path: "parentCategory", select: "name" },
  { path: "primaryCategory", select: "name" },
  { path: "secondaryCategory", select: "name" },
  { path: "brands", select: "name" },
  { path: "attributes.attributeId", select: "name" },
  { path: "productSize", select: "label" },
  { path: "productReviews", select: "rating" },
];

export async function POST(request: Request) {
  try {
    await connectToDB();
    const body = await request.json();

    const newProduct = new Products(body);
    await newProduct.save();

    return NextResponse.json(
      { success: true, data: newProduct },
      { status: 201 }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 400 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectToDB();
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (id) {
      // For single product fetch
      const product = await Products.findById(id)
        .select(commonFields)
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
    }

    // For product listing with pagination
    const [products] = await Promise.all([
      Products.find()
        .select(commonFields)
        .populate(populateConfig)
        .lean()
        .exec(),
      Products.countDocuments(),
    ]);

    return NextResponse.json({
      success: true,
      data: products,
    });
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
      runValidators: true, // Ensure update validates against schema
    })
      .select(commonFields)
      .populate(populateConfig)
      .lean()
      .exec();

    if (!updatedProduct) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updatedProduct });
  } catch (error: unknown) {
    console.error("Error in PUT products:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectToDB();
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Product ID is required" },
        { status: 400 }
      );
    }

    const deletedProduct = await Products.findByIdAndDelete(id).lean().exec();

    if (!deletedProduct) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: "Product deleted successfully" },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error in DELETE products:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

import Products from "@/lib/models/product.model";
import { connectToDB } from "@/lib/mongodb";
import { ProductService } from "@/services/product.service";
import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/middleware/auth";

// Commonly needed fields that we always want to retrieve
const commonFields =
  "productName parentCategory primaryCategory secondaryCategory brands productReviews productSize gender productQuantity attributes productStatus productSKU productColor productDescription productImages productCoverImage mrp basePrice discountType discountValue gstRate gstAmount netPrice deliveryCharges deliveryDate productWarranty productReturnPolicy metaTitle metaKeywords metaDescription";

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

export const POST = withAdminAuth(async (request: Request) => {
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
});

export const GET = withAdminAuth(async (request: NextRequest) => {
  try {
    await connectToDB();
    const searchParams = request.nextUrl.searchParams;

    // Check if it's a legacy request (fetchAll or no pagination params)
    const fetchAll = searchParams.get("all") === "true";
    const page = searchParams.get("page");
    const limit = searchParams.get("limit");

    // If pagination parameters are present, use server-side pagination
    const usePagination =
      page || limit || searchParams.get("search") || searchParams.get("sortBy");

    if (usePagination && !fetchAll) {
      // Use paginated response
      const paginationParams: PaginationParams = {
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 10,
        search: searchParams.get("search") || "",
        sortBy: searchParams.get("sortBy") || "createdAt",
        sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
      };

      const result = await ProductService.getProducts(paginationParams);
      return NextResponse.json(result);
    } else {
      // Legacy behavior - fetch all products for vendor or all products if fetchAll
      const result = await ProductService.getProductsLegacy();
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error("Error in GET products:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});

export const PUT = withAdminAuth(async (request: Request) => {
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
});

export const DELETE = withAdminAuth(async (request: NextRequest) => {
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
});

/* eslint-disable @typescript-eslint/no-unused-vars */

export const runtime = "nodejs";
import { getCurrentVendor } from "@/lib/actions/vendor.actions";
import Products from "@/lib/models/product.model";
import { connectToDB } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ProductService } from "@/services/product.service";

// Commonly needed fields that we always want to retrieve
const commonFields =
  "productName vendorId parentCategory primaryCategory secondaryCategory brands productReviews productSize gender productQuantity attributes productStatus productSKU productColor productDescription productImages productCoverImage mrp basePrice discountType discountValue gstRate gstAmount netPrice deliveryCharges deliveryDays productWarranty productReturnPolicy metaTitle metaKeywords metaDescription";

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
    const vendorResponse = await getCurrentVendor();
    if (!vendorResponse.success) {
      return NextResponse.json(
        { success: false, error: "Not authenticated as vendor" },
        { status: 401 }
      );
    }

    const body = await request.json();
    body.vendorId = vendorResponse.data?._id;

    const result = await ProductService.createProduct(body);
    return NextResponse.json(result, { status: result.success ? 201 : 400 });
  } catch (error) {
    console.error("Error in POST products:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
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

    // Get vendor information
    const vendorResponse = await getCurrentVendor();
    let vendorId: string | undefined;

    if (vendorResponse.success) {
      vendorId = vendorResponse.data?._id;
    } else if (!fetchAll) {
      return NextResponse.json(
        { success: false, error: "Not authenticated as vendor" },
        { status: 401 }
      );
    }

    if (usePagination && !fetchAll) {
      // Use paginated response
      const paginationParams: PaginationParams = {
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 10,
        search: searchParams.get("search") || "",
        sortBy: searchParams.get("sortBy") || "createdAt",
        sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
      };

      const result = await ProductService.getProducts(
        paginationParams,
        vendorId
      );
      return NextResponse.json(result);
    } else {
      // Legacy behavior - fetch all products for vendor or all products if fetchAll
      const result = await ProductService.getProductsLegacy(vendorId!);
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error("Error in GET products:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    await connectToDB();
    const body = await request.json();

    // Get the current vendor
    const vendorResponse = await getCurrentVendor();

    if (!vendorResponse.success) {
      return NextResponse.json(
        { success: false, error: "Not authenticated as vendor" },
        { status: 401 }
      );
    }

    const vendorId = vendorResponse?.data?._id;

    // Find and update the product, but only if it belongs to this vendor
    const updatedProduct = await Products.findOneAndUpdate(
      { _id: body._id, vendorId }, // Only update if product belongs to this vendor
      body,
      {
        new: true,
        runValidators: true,
      }
    )
      .select(commonFields)
      .populate(populateConfig)
      .lean()
      .exec();

    if (!updatedProduct) {
      return NextResponse.json(
        { success: false, error: "Product not found or not authorized" },
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

    // Get the current vendor
    const vendorResponse = await getCurrentVendor();

    if (!vendorResponse.success) {
      return NextResponse.json(
        { success: false, error: "Not authenticated as vendor" },
        { status: 401 }
      );
    }

    const vendorId = vendorResponse?.data?._id;

    // Delete the product, but only if it belongs to this vendor
    const deletedProduct = await Products.findOneAndDelete({
      _id: id,
      vendorId,
    })
      .lean()
      .exec();

    if (!deletedProduct) {
      return NextResponse.json(
        { success: false, error: "Product not found or not authorized" },
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

import { getCurrentVendor } from "@/lib/actions/vendor.actions";
import Products from "@/lib/models/product.model";
import { connectToDB } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";

// Commonly needed fields that we always want to retrieve
const commonFields =
  "productName vendorId parentCategory primaryCategory secondaryCategory brands productReviews productSize gender productQuantity attributes productStatus productSKU productColor productDescription productImages productCoverImage mrp basePrice discountType discountValue gstRate gstAmount netPrice deliveryCharges deliveryDate productWarranty productReturnPolicy metaTitle metaKeywords metaDescription";

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

    // Get the current vendor
    const vendorResponse = await getCurrentVendor();

    if (!vendorResponse.success) {
      return NextResponse.json(
        { success: false, error: "Not authenticated as vendor" },
        { status: 401 }
      );
    }

    // Assign the vendor ID to the new product
    body.vendorId = vendorResponse?.data?._id;

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

    // Get the current vendor
    const vendorResponse = await getCurrentVendor();

    if (!vendorResponse.success) {
      return NextResponse.json(
        { success: false, error: "Not authenticated as vendor" },
        { status: 401 }
      );
    }

    const vendorId = vendorResponse?.data?._id; // Get vendor ID from response

    if (id) {
      // For single product fetch - ensure it belongs to this vendor
      const product = await Products.findOne({ _id: id, vendorId })
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

    // For product listing - filter by current vendor
    const [products] = await Promise.all([
      Products.find({ vendorId }) // Only show this vendor's products
        .select(commonFields)
        .populate(populateConfig)
        .lean()
        .exec(),
      Products.countDocuments({ vendorId }),
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

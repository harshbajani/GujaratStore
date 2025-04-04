import { getCurrentVendor } from "@/lib/actions/vendor.actions";
import Discount from "@/lib/models/discount.model";
import { connectToDB } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";

const populateConfig = [
  { path: "parentCategory", select: "name isActive" },
  { path: "createdBy", select: "name email" },
];

export async function GET(request: NextRequest) {
  try {
    await connectToDB();
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const categoryId = searchParams.get("categoryId");
    const isPublic = searchParams.get("public") === "true";

    // Get discount by ID (applies regardless of context)
    if (id) {
      const discount = await Discount.findById(id)
        .populate(populateConfig)
        .lean()
        .exec();

      if (!discount) {
        return NextResponse.json(
          { success: false, error: "Discount not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: discount });
    }

    // Get discounts by category ID (for public, still apply date filtering)
    if (categoryId) {
      const now = new Date();
      const discounts = await Discount.find({
        parentCategory: categoryId,
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gt: now },
      })
        .populate(populateConfig)
        .sort({ discountValue: -1 })
        .lean()
        .exec();

      return NextResponse.json({ success: true, data: discounts });
    }

    // If the request is public, return all active discounts regardless of vendor
    if (isPublic) {
      const now = new Date();
      const discounts = await Discount.find({
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gt: now },
      })
        .populate(populateConfig)
        // Sort first by vendorId then by createdAt descending (or any other order you prefer)
        .sort({ vendorId: 1, createdAt: -1 })
        .lean()
        .exec();
      return NextResponse.json({ success: true, data: discounts });
    }

    // For vendor-specific listing, verify vendor identity and filter by vendorId.
    const vendorResponse = await getCurrentVendor();
    if (!vendorResponse.success) {
      return NextResponse.json(
        { success: false, error: "Not authenticated as vendor" },
        { status: 401 }
      );
    }
    const vendorId = vendorResponse.data?._id;

    const discounts = await Discount.find({ vendorId })
      .populate(populateConfig)
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return NextResponse.json({ success: true, data: discounts });
  } catch (error: unknown) {
    console.error("Error in GET discounts:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectToDB();
    const body = await request.json();

    if (!body.vendorId) {
      const vendorResponse = await getCurrentVendor();
      if (vendorResponse.success && vendorResponse.data) {
        body.vendorId = vendorResponse.data._id;
      }
    }

    const newDiscount = new Discount(body);
    await newDiscount.save();

    const populatedDiscount = await Discount.findById(newDiscount._id)
      .populate(populateConfig)
      .lean()
      .exec();

    return NextResponse.json(
      { success: true, data: populatedDiscount },
      { status: 201 }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 400 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    await connectToDB();
    const body = await request.json();

    if (!body._id) {
      return NextResponse.json(
        { success: false, error: "Discount ID is required" },
        { status: 400 }
      );
    }

    const updatedDiscount = await Discount.findByIdAndUpdate(
      body._id,
      { ...body, updatedAt: new Date() },
      { new: true }
    )
      .populate(populateConfig)
      .lean()
      .exec();

    if (!updatedDiscount) {
      return NextResponse.json(
        { success: false, error: "Discount not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updatedDiscount });
  } catch (error: unknown) {
    console.error("Error in PUT discounts:", error);
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
        { success: false, error: "Discount ID is required" },
        { status: 400 }
      );
    }

    const deletedDiscount = await Discount.findByIdAndDelete(id).lean().exec();

    if (!deletedDiscount) {
      return NextResponse.json(
        { success: false, error: "Discount not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: "Discount deleted successfully" },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error in DELETE discounts:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

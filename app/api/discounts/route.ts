import Discount from "@/lib/models/discount.model";
import { connectToDB } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";

// Populate configuration
const populateConfig = [
  { path: "parentCategory", select: "name isActive" },
  { path: "createdBy", select: "name email" },
];

export async function GET(request: NextRequest) {
  try {
    await connectToDB();
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const referralCode = searchParams.get("referralCode");
    const categoryId = searchParams.get("categoryId");

    // Get discount by ID
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

    // Get discount by referral code
    if (referralCode) {
      const query: any = {
        referralCode,
        isActive: true,
        startDate: { $lte: new Date() },
        endDate: { $gt: new Date() },
      };

      if (categoryId) {
        query.parentCategory = categoryId;
      }

      const discount = await Discount.findOne(query)
        .populate(populateConfig)
        .lean()
        .exec();

      if (!discount) {
        return NextResponse.json(
          { success: false, error: "Invalid or expired referral code" },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: discount });
    }

    // Get all discounts
    const discounts = await Discount.find()
      .populate(populateConfig)
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return NextResponse.json({
      success: true,
      data: discounts,
    });
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

import Referral from "@/lib/models/referral.model";
import { connectToDB } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";

const populateConfig = [
  { path: "parentCategory", select: "name isActive" },
  { path: "createdBy", select: "name email" },
];

export async function GET(request: NextRequest) {
  try {
    await connectToDB();
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const code = searchParams.get("code");
    const categoryId = searchParams.get("categoryId");

    // Get referral by ID
    if (id) {
      const referral = await Referral.findById(id)
        .populate(populateConfig)
        .lean()
        .exec();

      if (!referral) {
        return NextResponse.json(
          { success: false, error: "Referral not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: referral });
    }

    // Get referral by code
    if (code) {
      const now = new Date();
      const referral = await Referral.findOne({
        code,
        isActive: true,
        expiryDate: { $gt: now },
        $expr: { $lt: ["$usedCount", "$maxUses"] },
      })
        .populate(populateConfig)
        .lean()
        .exec();

      if (!referral) {
        return NextResponse.json(
          { success: false, error: "Referral not found or expired" },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: referral });
    }

    // Get referrals by category ID
    if (categoryId) {
      const now = new Date();
      const referrals = await Referral.find({
        parentCategory: categoryId,
        isActive: true,
        expiryDate: { $gt: now },
        $expr: { $lt: ["$usedCount", "$maxUses"] },
      })
        .populate(populateConfig)
        .sort({ discountValue: -1 })
        .lean()
        .exec();

      return NextResponse.json({ success: true, data: referrals });
    }

    // Get all referrals
    const referrals = await Referral.find()
      .populate(populateConfig)
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return NextResponse.json({
      success: true,
      data: referrals,
    });
  } catch (error: unknown) {
    console.error("Error in GET referrals:", error);
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

    // Generate a unique code if not provided
    if (!body.code) {
      body.code = nanoid(8);
    }

    const newReferral = new Referral(body);
    await newReferral.save();

    const populatedReferral = await Referral.findById(newReferral._id)
      .populate(populateConfig)
      .lean()
      .exec();

    return NextResponse.json(
      { success: true, data: populatedReferral },
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
        { success: false, error: "Referral ID is required" },
        { status: 400 }
      );
    }

    const updatedReferral = await Referral.findByIdAndUpdate(
      body._id,
      { ...body, updatedAt: new Date() },
      { new: true }
    )
      .populate(populateConfig)
      .lean()
      .exec();

    if (!updatedReferral) {
      return NextResponse.json(
        { success: false, error: "Referral not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updatedReferral });
  } catch (error: unknown) {
    console.error("Error in PUT referrals:", error);
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
        { success: false, error: "Referral ID is required" },
        { status: 400 }
      );
    }

    const deletedReferral = await Referral.findByIdAndDelete(id).lean().exec();

    if (!deletedReferral) {
      return NextResponse.json(
        { success: false, error: "Referral not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: "Referral deleted successfully" },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error in DELETE referrals:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

// Special API to increment usage count when a referral is applied
export async function PATCH(request: Request) {
  try {
    await connectToDB();
    const body = await request.json();

    if (!body.code) {
      return NextResponse.json(
        { success: false, error: "Referral code is required" },
        { status: 400 }
      );
    }

    const referral = await Referral.findOne({ code: body.code });

    if (!referral) {
      return NextResponse.json(
        { success: false, error: "Referral not found" },
        { status: 404 }
      );
    }

    // Check if referral is still valid
    const now = new Date();
    if (
      !referral.isActive ||
      referral.expiryDate < now ||
      referral.usedCount >= referral.maxUses
    ) {
      return NextResponse.json(
        { success: false, error: "Referral is no longer valid" },
        { status: 400 }
      );
    }

    // Increment the usage count
    referral.usedCount += 1;
    await referral.save();

    return NextResponse.json({
      success: true,
      data: {
        message: "Referral usage recorded successfully",
        usedCount: referral.usedCount,
        maxUses: referral.maxUses,
      },
    });
  } catch (error: unknown) {
    console.error("Error in PATCH referrals:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

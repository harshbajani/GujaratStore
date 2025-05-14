import Referral from "@/lib/models/referral.model";
import User from "@/lib/models/user.model";
import { connectToDB } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getCurrentVendor } from "@/lib/actions/vendor.actions";

const populateConfig = [{ path: "createdBy", select: "name email" }];

export async function GET(request: NextRequest) {
  try {
    await connectToDB();
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const code = searchParams.get("code");

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

    const vendorResponse = await getCurrentVendor();
    if (!vendorResponse.success) {
      return NextResponse.json(
        { success: false, error: "Not authenticated as vendor" },
        { status: 401 }
      );
    }
    const vendorId = vendorResponse.data?._id;

    // Get all referrals
    const referrals = await Referral.find({ vendorId })
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

// Special API to apply referral and add reward points to user
export async function PATCH(request: Request) {
  try {
    await connectToDB();
    const body = await request.json();

    if (!body.code || !body.userId) {
      return NextResponse.json(
        { success: false, error: "Referral code and userId are required" },
        { status: 400 }
      );
    }

    // Find the referral by code
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

    // Find the user and add reward points
    const user = await User.findById(body.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Check if the user has already used a referral code
    if (user.referralUsed) {
      return NextResponse.json(
        { success: false, error: "User has already used a referral code" },
        { status: 400 }
      );
    }

    // Add reward points to user's wallet and mark referral as used
    user.rewardPoints += referral.rewardPoints;
    user.referral = referral.code;
    user.referralUsed = true;
    await user.save();

    // Increment the usage count for the referral
    referral.usedCount += 1;
    await referral.save();

    return NextResponse.json({
      success: true,
      data: {
        message: "Referral applied successfully",
        rewardPoints: referral.rewardPoints,
        totalPoints: user.rewardPoints,
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

import User from "@/lib/models/user.model";
import { connectToDB } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    await connectToDB();
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    // Find the user to get their referral code
    const user = await User.findById<IUser>(userId).lean();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // If user has a referral code, fetch the referral details
    if (user.referral) {
      const referralResponse = await fetch(
        `${process.env.NEXT_PUBLIC_APP_BASE_URL}/api/referrals?code=${user.referral}`
      );
      const referralData = await referralResponse.json();

      if (referralData.success) {
        return NextResponse.json({
          success: true,
          data: {
            rewardPoints: referralData.data.rewardPoints,
            conversionRate: 10, // 10 points = ₹1
          },
        });
      }
    }

    // If no referral found or user doesn't have a referral, return 0 points
    return NextResponse.json({
      success: true,
      data: {
        rewardPoints: 0,
        conversionRate: 10,
      },
    });
  } catch (error: unknown) {
    console.error("Error fetching reward points:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
// POST route to redeem reward points
export async function POST(request: Request) {
  try {
    await connectToDB();
    const body = await request.json();

    if (!body.userId || body.pointsToRedeem === undefined) {
      return NextResponse.json(
        { success: false, error: "User ID and points to redeem are required" },
        { status: 400 }
      );
    }

    // Find the user
    const user = await User.findById(body.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user has enough points
    if (user.rewardPoints < body.pointsToRedeem) {
      return NextResponse.json(
        { success: false, error: "Not enough reward points" },
        { status: 400 }
      );
    }

    // Calculate discount amount (points / 10)
    const discountAmount = Math.floor(body.pointsToRedeem / 10);

    // Subtract points from user's wallet
    user.rewardPoints -= body.pointsToRedeem;
    await user.save();

    return NextResponse.json({
      success: true,
      data: {
        message: "Reward points redeemed successfully",
        discountAmount,
        remainingPoints: user.rewardPoints,
      },
    });
  } catch (error: unknown) {
    console.error("Error redeeming reward points:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

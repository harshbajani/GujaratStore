//app/api/rewards/redeem/route.ts
import User from "@/lib/models/user.model";
import { connectToDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";

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

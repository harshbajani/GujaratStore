import { DiscountService } from "@/services/discount.service";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { code, items, userId, deliveryCharges, rewardDiscountAmount } =
      await request.json();

    if (!code || !items || !userId) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await DiscountService.validateDiscount(
      code,
      items,
      userId,
      deliveryCharges || 0,
      rewardDiscountAmount || 0
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Validate discount error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

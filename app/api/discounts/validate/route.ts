import { connectToDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import Discount from "@/lib/models/discount.model";
import Products from "@/lib/models/product.model";

interface CartItem {
  productId: string;
  price: number;
  quantity: number;
}

export async function POST(request: Request) {
  try {
    await connectToDB();

    const { code, items } = await request.json();

    if (!code) {
      return NextResponse.json(
        { success: false, message: "Discount code is required" },
        { status: 400 }
      );
    }

    const currentDate = new Date();

    // Find discount by either referral code or direct match with name
    const discount = await Discount.findOne({
      $or: [{ referralCode: code }, { name: code }],
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate },
      isActive: true,
    }).populate("parentCategory");

    if (!discount) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired discount code" },
        { status: 404 }
      );
    }

    // For category discounts, we need to check if any items match the category
    let discountAmount = 0;
    let applicableSubtotal = 0;

    if (discount.targetType === "category") {
      // Get category ID we're looking for
      const categoryId = discount.parentCategory._id.toString();

      // Get all products to check their categories

      const productIds: string[] = items.map(
        (item: CartItem) => item.productId
      );
      const products = await Products.find({ _id: { $in: productIds } });

      // Map product IDs to their categories for easy lookup
      const productCategories: Record<string, string> = {};
      products.forEach((product) => {
        productCategories[product._id.toString()] =
          product.parentCategory.toString();
      });

      // Calculate applicable subtotal based on matching category
      items.forEach((item: CartItem) => {
        if (productCategories[item.productId] === categoryId) {
          applicableSubtotal += item.price * item.quantity;
        }
      });

      if (applicableSubtotal === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "No eligible items for this category discount",
          },
          { status: 400 }
        );
      }
    } else {
      // For referral discounts, apply to the entire order
      applicableSubtotal = items.reduce(
        (sum: number, item: CartItem): number =>
          sum + item.price * item.quantity,
        0
      );
    }

    // Calculate discount amount
    if (discount.discountType === "percentage") {
      discountAmount = Math.round(
        (applicableSubtotal * discount.discountValue) / 100
      );
    } else {
      // For fixed amount discounts, ensure we don't exceed the applicable subtotal
      discountAmount = Math.min(discount.discountValue, applicableSubtotal);
    }

    return NextResponse.json(
      {
        success: true,
        discount: {
          _id: discount._id,
          name: discount.name,
          type: discount.discountType,
          value: discount.discountValue,
          targetType: discount.targetType,
        },
        discountAmount,
        message:
          discount.discountType === "percentage"
            ? `${discount.discountValue}% discount applied`
            : `₹${discount.discountValue} discount applied`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error validating discount:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "An error occurred",
      },
      { status: 500 }
    );
  }
}

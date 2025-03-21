import { connectToDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import Discount from "@/lib/models/discount.model";
import Products from "@/lib/models/product.model";
import UsedDiscount from "@/lib/models/usedDiscount.model";

interface CartItem {
  productId: string;
  price: number;
  quantity: number;
}

export async function POST(request: Request) {
  try {
    await connectToDB();

    const { code, items, userId } = await request.json();

    if (!code || !userId) {
      return NextResponse.json(
        { success: false, message: "Discount code is required" },
        { status: 400 }
      );
    }

    const currentDate = new Date();

    const usedDiscount = await UsedDiscount.findOne({
      userId,
      discountCode: code,
    });

    if (usedDiscount) {
      return NextResponse.json(
        {
          success: false,
          message: "You have already used this discount code",
        },
        { status: 400 }
      );
    }

    // Find discount by name only (since we've removed referral codes)
    const discount = await Discount.findOne({
      name: code,
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
    if (discount) {
      // Record discount usage
      await UsedDiscount.create({
        userId,
        discountCode: code,
        usedAt: new Date(),
      });
    }

    // For category discounts, we need to check if any items match the category
    let discountAmount = 0;
    let applicableSubtotal = 0;

    // Get category ID we're looking for
    const categoryId = discount.parentCategory._id.toString();

    // Get all products to check their categories
    const productIds: string[] = items.map((item: CartItem) => item.productId);
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
        applicableSubtotal,
        message:
          discount.discountType === "percentage"
            ? `${discount.discountValue}% discount applied to eligible items`
            : `₹${discount.discountValue} discount applied to eligible items`,
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

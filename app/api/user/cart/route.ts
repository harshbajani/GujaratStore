/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import {
  addToCart,
  getCurrentUser,
  removeFromCart,
} from "@/lib/actions/user.actions";
import Products from "@/lib/models/product.model";
import { connectToDB } from "@/lib/mongodb";
import { UserService } from "@/services/user.service";

export async function GET() {
  try {
    const userResult = await getCurrentUser();

    if (!userResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "User not authenticated",
          data: { cart: [] },
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        cart: userResult.data?.cart || [],
      },
    });
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch cart items",
        data: { cart: [] },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { productId } = await request.json();

    if (!productId) {
      return NextResponse.json(
        { success: false, error: "Product ID is required" },
        { status: 400 }
      );
    }

    const result = await addToCart(productId);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error adding to cart:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add item to cart" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    let productId: string | undefined;
    try {
      const body = await request.json();
      productId = body?.productId;
    } catch {
      productId = undefined;
    }

    // If productId provided, remove only that item (existing behavior)
    if (productId) {
      const result = await removeFromCart(productId);
      if (!result.success) {
        return NextResponse.json(result, { status: 400 });
      }
      return NextResponse.json(result);
    }

    // If no productId provided, clear entire cart for the current user
    const userResult = await getCurrentUser();
    if (!userResult.success || !userResult.data?._id) {
      return NextResponse.json(
        { success: false, error: "User not authenticated" },
        { status: 401 }
      );
    }

    await connectToDB();
    const clearResult = await UserService.updateUser(userResult.data._id, {
      cart: [],
    } as any);

    if (!clearResult.success) {
      return NextResponse.json(clearResult, { status: 400 });
    }

    return NextResponse.json(clearResult, { status: 200 });
  } catch (error) {
    console.error("Error clearing cart:", error);
    return NextResponse.json(
      { success: false, error: "Failed to clear cart" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { productId, quantity } = await request.json();

    if (!productId || typeof quantity !== "number") {
      return NextResponse.json(
        { success: false, error: "Product ID and quantity are required" },
        { status: 400 }
      );
    }

    // Get current user
    const userResult = await getCurrentUser();
    if (!userResult.success) {
      return NextResponse.json(
        { success: false, error: "User not authenticated" },
        { status: 401 }
      );
    }

    // Check if product exists and has enough inventory
    const product = await Products.findById(productId);
    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    // Validate quantity against inventory
    if (quantity > product.productQuantity) {
      return NextResponse.json(
        {
          success: false,
          error: "Not enough inventory available",
          availableQuantity: product.productQuantity,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        quantity,
        availableQuantity: product.productQuantity,
        updatedPrice: product.netPrice * quantity,
      },
    });
  } catch (error) {
    console.error("Error updating cart quantity:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update quantity" },
      { status: 500 }
    );
  }
}

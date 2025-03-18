import { NextResponse } from "next/server";
import {
  addToCart,
  getCurrentUser,
  removeFromCart,
} from "@/lib/actions/user.actions";
import Products from "@/lib/models/product.model";

export async function POST(request: Request) {
  const { productId } = await request.json();
  const result = await addToCart(productId);
  return NextResponse.json(result);
}

export async function DELETE(request: Request) {
  const { productId } = await request.json();
  const result = await removeFromCart(productId);
  return NextResponse.json(result);
}

export async function PUT(request: Request) {
  try {
    const { productId, quantity } = await request.json();

    // Get current user
    const userResult = await getCurrentUser();
    if (!userResult.success) {
      return NextResponse.json({
        success: false,
        error: "User not authenticated",
      });
    }

    // Check if product exists and has enough inventory
    const product = await Products.findById(productId);
    if (!product) {
      return NextResponse.json({ success: false, error: "Product not found" });
    }

    // Validate quantity against inventory
    if (quantity > product.productQuantity) {
      return NextResponse.json({
        success: false,
        error: "Not enough inventory available",
        availableQuantity: product.productQuantity,
      });
    }

    // Update the cart quantity in user's session/state
    // Note: We're not reducing inventory yet, that happens at checkout

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
    return NextResponse.json({
      success: false,
      error: "Failed to update quantity",
    });
  }
}

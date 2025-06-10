import { NextResponse } from "next/server";
import {
  addToCart,
  getCurrentUser,
  removeFromCart,
} from "@/lib/actions/user.actions";
import Products from "@/lib/models/product.model";

export async function GET() {
  try {
    const userResult = await getCurrentUser();

    if (!userResult.success) {
      return NextResponse.json({
        success: false,
        error: "User not authenticated",
      });
    }
    return NextResponse.json({
      success: true,
      data: {
        cart: userResult.data?.cart || [],
      },
    });
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch cart items",
    });
  }
}

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

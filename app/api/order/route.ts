import Order from "@/lib/models/order.model";
import Products from "@/lib/models/product.model";
import User from "@/lib/models/user.model";
import { connectToDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // Establish database connection
    await connectToDB();

    // Parse the request body
    const body = await request.json();
    const {
      orderId,
      status,
      userId,
      items,
      subtotal,
      deliveryCharges,
      total,
      addressId,
      paymentOption,
    } = body;

    // Basic validation: Ensure required fields are provided
    if (
      !orderId ||
      !userId ||
      !items ||
      items.length === 0 ||
      !subtotal ||
      !total ||
      !addressId ||
      !paymentOption
    ) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    for (const item of items) {
      const product = await Products.findById(item.productId);
      if (!product) {
        return NextResponse.json(
          { success: false, message: `Product not found: ${item.productId}` },
          { status: 400 }
        );
      }
      if (
        product.productQuantity <= 0 ||
        product.productQuantity < item.quantity
      ) {
        return NextResponse.json(
          {
            success: false,
            message: `Product "${item.productName}" is out of stock or only ${product.productQuantity} available.`,
          },
          { status: 400 }
        );
      }
    }

    // Create new order document
    const newOrder = new Order({
      orderId,
      status: status || "confirmed",
      userId,
      items,
      subtotal,
      deliveryCharges,
      total,
      addressId,
      paymentOption,
    });

    await newOrder.save();

    for (const item of items) {
      await Products.findByIdAndUpdate(item.productId, {
        $inc: { productQuantity: -item.quantity },
      });
    }

    await User.findByIdAndUpdate(userId, {
      $push: { order: newOrder._id },
      cart: [],
    });

    setTimeout(async () => {
      try {
        await Order.findByIdAndUpdate(newOrder._id, { status: "processing" });
        console.log(
          "Order status updated to processing for order",
          newOrder._id
        );
      } catch (error) {
        console.error("Error updating order status:", error);
      }
    }, 5000);

    return NextResponse.json(
      { success: true, order: newOrder },
      { status: 201 }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "An error occurred",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    // Establish database connection
    await connectToDB();

    // Get query parameters (for potential filtering)
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");

    // Build query object
    const query: { userId?: string; status?: string } = {};

    // Apply filters if provided
    if (userId) query.userId = userId;
    if (status) query.status = status;

    // Find orders with optional filters
    const orders = await Order.find(query).sort({ createdAt: -1 });

    // Return the orders data
    return NextResponse.json({ success: true, data: orders }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "An error occurred",
      },
      { status: 500 }
    );
  }
}

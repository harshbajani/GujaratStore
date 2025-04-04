/* eslint-disable @typescript-eslint/no-explicit-any */
import { getCurrentVendor } from "@/lib/actions/vendor.actions";
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
    await connectToDB();
    const { searchParams } = new URL(request.url);

    // Try to get the current vendor first.
    const vendorResponse = await getCurrentVendor();

    let query: any = {};

    // If the vendor is authenticated, filter orders to include only those
    // that have at least one order item with a matching vendorId.
    if (vendorResponse.success && vendorResponse.data?._id) {
      const vendorId = vendorResponse.data._id;
      query = { "items.vendorId": vendorId };

      // Optionally, if status filtering is provided:
      const status = searchParams.get("status");
      if (status) query.status = status;
    } else {
      // Otherwise, fall back to user-based filtering (for a customer)
      const userId = searchParams.get("userId");
      if (userId) query.userId = userId;
      const status = searchParams.get("status");
      if (status) query.status = status;
    }

    // Find orders matching the query
    const orders = await Order.find(query).sort({ createdAt: -1 });

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

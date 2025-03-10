import Order from "@/lib/models/order.models";
import { connectToDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    // Establish database connection
    await connectToDB();

    // Get the orderId from the route params
    const { orderId } = await params;

    // Basic validation: Ensure orderId is provided
    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "Order ID is required" },
        { status: 400 }
      );
    }

    // Find the order with the given orderId
    const order = await Order.findOne({ orderId });

    // Check if order exists
    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    // Return the order data
    return NextResponse.json({ success: true, order }, { status: 200 });
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

import Order from "@/lib/models/order.model";
import { connectToDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Establish database connection
    await connectToDB();

    // Get the MongoDB ObjectId from the route params
    const { id } = params;

    // Basic validation: Ensure id is provided
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Order ID is required" },
        { status: 400 }
      );
    }

    // Find the order with the given MongoDB ObjectId
    const order = await Order.findById(id);

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

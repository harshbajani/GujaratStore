import Order from "@/lib/models/order.model";
import { connectToDB } from "@/lib/mongodb";

import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: RouteParams) {
  try {
    // Establish database connection
    await connectToDB();

    // Get the MongoDB ObjectId from the route params
    const { id } = await params;

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

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    // Establish database connection
    await connectToDB();

    // Get the MongoDB ObjectId from the route params
    const { id } = await params;

    // Basic validation: Ensure id is provided
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Order ID is required" },
        { status: 400 }
      );
    }

    // Find the order first to check if it exists
    const order = await Order.findById(id);

    // Check if order exists
    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    // Delete the order
    await Order.findByIdAndDelete(id);

    // Return success response
    return NextResponse.json(
      { success: true, message: "Order deleted successfully" },
      { status: 200 }
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

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    // Establish database connection
    await connectToDB();

    // Get the MongoDB ObjectId from the route params
    const { id } = await params;

    // Parse the request body
    const body = await request.json();
    const { status } = body;

    // Basic validation: Ensure id is provided
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Order ID is required" },
        { status: 400 }
      );
    }

    // Basic validation: Ensure status is provided and valid
    if (!status) {
      return NextResponse.json(
        { success: false, message: "Status is required" },
        { status: 400 }
      );
    }

    // Validate status value
    const validStatuses = [
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "returned",
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status value" },
        { status: 400 }
      );
    }

    // Find and update the order
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true } // Return the updated document
    );

    // Check if order exists
    if (!updatedOrder) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    // Return the updated order
    return NextResponse.json(
      {
        success: true,
        message: "Order status updated successfully",
        data: updatedOrder,
      },
      { status: 200 }
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

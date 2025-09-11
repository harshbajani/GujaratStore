/* eslint-disable @typescript-eslint/no-explicit-any */
import { OrdersService } from "@/services/orders.service";
import { connectToDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{
    orderId: string;
  }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    // Establish database connection
    await connectToDB();

    const { orderId } = await params;
    const updateData = await request.json();

    // Basic validation: Ensure orderId is provided
    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "Order ID is required" },
        { status: 400 }
      );
    }

    const result = await OrdersService.updateOrderByOrderId(orderId, updateData);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, order: result.data },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "An error occurred",
      },
      { status: 500 }
    );
  }
}

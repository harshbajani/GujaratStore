/* eslint-disable @typescript-eslint/no-explicit-any */
import { getCurrentVendor } from "@/lib/actions/vendor.actions";
import { OrdersService } from "@/services/orders.service";
import { connectToDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // Establish database connection
    await connectToDB();

    const orderData = await request.json();
    const result = await OrdersService.createOrder(orderData);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, order: result.order },
      { status: 201 }
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

    const result = await OrdersService.getOrders(query);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, data: result.data },
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

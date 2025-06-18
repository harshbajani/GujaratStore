import { OrdersService } from "@/services/orders.service";
import { connectToDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import {
  sendAdminCancellationEmail,
  sendOrderCancellationEmail,
  sendVendorCancellationEmail,
} from "@/lib/workflows/email";
import User from "@/lib/models/user.model";

export async function GET(request: Request, { params }: RouteParams) {
  try {
    // Establish database connection
    await connectToDB();

    const { id } = await params;

    // Basic validation: Ensure id is provided
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Order ID is required" },
        { status: 400 }
      );
    }

    const result = await OrdersService.getOrderById(id);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 404 }
      );
    }

    // Return the order data
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

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const {
      status,
      cancellationReason,
      isVendorCancellation,
      isAdminCancellation,
    } = await request.json();

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

    const result = await OrdersService.updateOrderStatus(id, status);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }

    // If the order is being cancelled, send a cancellation email
    if (status === "cancelled" && result.data) {
      try {
        const orderData = result.data as IOrder;
        // Get user details from the order's userId
        const user = await User.findById(orderData.userId);

        if (!user) {
          console.error("User not found for order cancellation email");
          return NextResponse.json(result, { status: 200 });
        }

        // If it's a vendor cancellation, use the vendor cancellation email
        if (isAdminCancellation) {
          if (!cancellationReason) {
            console.error(
              "Cancellation reason is required for vendor cancellations"
            );
            return NextResponse.json(result, { status: 200 });
          }
          await sendAdminCancellationEmail({
            orderId: orderData.orderId,
            userName: user.name,
            userEmail: user.email,
            items: orderData.items,
            subtotal: orderData.subtotal,
            deliveryCharges: orderData.deliveryCharges,
            total: orderData.total,
            createdAt: orderData.createdAt,
            paymentOption: orderData.paymentOption,
            address: orderData.address || {
              name: "",
              contact: "",
              address_line_1: "",
              address_line_2: "",
              locality: "",
              state: "",
              pincode: "",
              type: "",
            },
            discountAmount: orderData.discountAmount,
            cancellationReason: cancellationReason,
          });
        } else if (isVendorCancellation) {
          if (!cancellationReason) {
            console.error(
              "Cancellation reason is required for vendor cancellations"
            );
            return NextResponse.json(result, { status: 200 });
          }
          await sendVendorCancellationEmail({
            orderId: orderData.orderId,
            userName: user.name,
            userEmail: user.email,
            items: orderData.items,
            subtotal: orderData.subtotal,
            deliveryCharges: orderData.deliveryCharges,
            total: orderData.total,
            createdAt: orderData.createdAt,
            paymentOption: orderData.paymentOption,
            address: orderData.address || {
              name: "",
              contact: "",
              address_line_1: "",
              address_line_2: "",
              locality: "",
              state: "",
              pincode: "",
              type: "",
            },
            discountAmount: orderData.discountAmount,
            cancellationReason: cancellationReason,
          });
        } else {
          // For user cancellations, use the regular cancellation email
          await sendOrderCancellationEmail({
            orderId: orderData.orderId,
            userName: user.name,
            userEmail: user.email,
            items: orderData.items,
            subtotal: orderData.subtotal,
            deliveryCharges: orderData.deliveryCharges,
            total: orderData.total,
            createdAt: orderData.createdAt,
            paymentOption: orderData.paymentOption,
            address: orderData.address || {
              name: "",
              contact: "",
              address_line_1: "",
              address_line_2: "",
              locality: "",
              state: "",
              pincode: "",
              type: "",
            },
            discountAmount: orderData.discountAmount,
          });
        }
      } catch (emailError) {
        console.error("Failed to send cancellation email:", emailError);
        // Don't fail the request if email sending fails
      }
    }

    return NextResponse.json(result, { status: 200 });
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

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Basic validation: Ensure id is provided
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Order ID is required" },
        { status: 400 }
      );
    }

    const result = await OrdersService.deleteOrder(id);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json(result, { status: 200 });
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

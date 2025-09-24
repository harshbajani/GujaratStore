import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import { OrdersService } from "@/services/orders.service";
import { OrderRefundService } from "@/services/order-refund.service";
import { connectToDB } from "@/lib/mongodb";
import Order from "@/lib/models/order.model";
import User from "@/lib/models/user.model";
import {
  sendOrderCancellationEmail,
  sendRefundInitiatedEmail,
  sendRefundProcessedEmail,
  sendRefundFailedEmail,
  sendRefundUnderReviewEmail,
} from "@/lib/workflows/emails";
import type { RefundEmailData } from "@/lib/workflows/emails/shared/types";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get user session for authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    await connectToDB();

    const { id: orderId } = await params;
    const body = await request.json();
    const { reason = "Order cancelled by customer" } = body;

    // Validate order ID
    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "Order ID is required" },
        { status: 400 }
      );
    }

    // Get the order
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    // Get user to verify ownership
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Verify order ownership
    if (order.userId.toString() !== user._id.toString()) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Order does not belong to you" },
        { status: 403 }
      );
    }

    // Check if order can be cancelled based on status
    // Users cannot cancel orders once they are "ready to ship" or in later stages
    const nonCancellableStatuses = [
      "ready to ship",
      "shipped", 
      "delivered",
      "cancelled",
      "returned",
    ];
    
    if (nonCancellableStatuses.includes(order.status)) {
      const statusMessages = {
        "ready to ship":
          "Orders that are ready to ship cannot be cancelled. The vendor has already prepared your order for shipping. Please contact support if you need assistance.",
        shipped:
          "Orders that have been shipped cannot be cancelled. You can return the order after delivery.",
        delivered:
          "Orders that have been delivered cannot be cancelled. You can return the order instead.",
        cancelled: "This order is already cancelled.",
        returned: "This order has already been returned.",
      };

      return NextResponse.json(
        {
          success: false,
          message:
            statusMessages[order.status as keyof typeof statusMessages] ||
            "This order cannot be cancelled.",
        },
        { status: 400 }
      );
    }

    // Step 1: Update order status to cancelled
    const updateResult = await OrdersService.updateOrderStatus(orderId, "cancelled");
    if (!updateResult.success) {
      return NextResponse.json(
        { success: false, message: updateResult.message },
        { status: 400 }
      );
    }

    // Step 2: Process refund if applicable
    let refundResponse = null;
    try {
      refundResponse = await OrderRefundService.processOrderCancellationRefund({
        orderId: orderId,
        reason: reason,
        userId: user._id.toString(),
      });

      if (!refundResponse.success) {
        console.warn("Refund processing failed:", refundResponse.message);
        // Don't fail the cancellation if refund fails - log it for manual processing
      }
    } catch (refundError) {
      console.error("Refund processing error:", refundError);
      // Don't fail the cancellation if refund fails
    }

    // Step 2.5: Send refund status email if refund was attempted
    if (refundResponse && order.paymentOption !== "cash-on-delivery") {
      try {
        const refundEmailData: RefundEmailData = {
          orderId: order.orderId,
          userName: user.name,
          userEmail: user.email,
          email: user.email,
          customerName: user.name,
          orderDate: order.createdAt,
          orderTotal: order.total.toString(),
          refundAmount: order.total.toString(),
          refundId: refundResponse.refundDetails?.refundId,
          refundStatus: refundResponse.success ? "initiated" : "failed",
          refundReason: reason,
          paymentMethod: order.paymentOption,
          expectedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "short",
            day: "numeric",
          }),
        };

        // Send appropriate refund email based on status
        if (refundResponse.success) {
          if (refundResponse.refundDetails?.refundStatus === "processed") {
            await sendRefundProcessedEmail(refundEmailData);
          } else if (refundResponse.refundDetails?.refundStatus === "manual_review") {
            await sendRefundUnderReviewEmail(refundEmailData);
          } else {
            // Default to initiated for pending/other statuses
            await sendRefundInitiatedEmail(refundEmailData);
          }
        } else {
          // Send failed email for failed refund processing
          refundEmailData.refundStatus = "failed";
          await sendRefundFailedEmail(refundEmailData);
        }
      } catch (emailError) {
        console.error("Failed to send refund email:", emailError);
        // Don't fail the request if refund email fails
      }
    }

    // Step 3: Send cancellation email
    try {
      await sendOrderCancellationEmail({
        orderId: order.orderId,
        userName: user.name,
        userEmail: user.email,
        email: user.email,
        orderDate: order.createdAt,
        items: order.items,
        subtotal: order.subtotal,
        deliveryCharges: order.deliveryCharges,
        total: order.total,
        createdAt: order.createdAt,
        paymentOption: order.paymentOption,
        address: order.address || {
          name: "",
          contact: "",
          address_line_1: "",
          address_line_2: "",
          locality: "",
          state: "",
          pincode: "",
          type: "",
        },
        discountAmount: order.discountAmount || 0,
        cancellationReason: reason,
        reason: reason,
        customerName: user.name,
        vendorEmail: "contact@thegujaratstore.com",
        paymentMethod: order.paymentOption,
        orderTotal: order.total.toString(),
        refundAmount: order.total.toString(),
      });
    } catch (emailError) {
      console.error("Failed to send cancellation email:", emailError);
      // Don't fail the request if email sending fails
    }

    // Prepare response message
    let message = "Order cancelled successfully";
    if (refundResponse?.success) {
      message += `. ${refundResponse.message}`;
    } else if (refundResponse && !refundResponse.success) {
      // If refund failed but order was cancelled
      message += ". Refund will be processed manually if applicable.";
    }

    return NextResponse.json(
      {
        success: true,
        message: message,
        data: {
          orderId: order._id,
          status: "cancelled",
          refundInfo: refundResponse?.refundDetails || null,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("User order cancellation error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to cancel order",
      },
      { status: 500 }
    );
  }
}

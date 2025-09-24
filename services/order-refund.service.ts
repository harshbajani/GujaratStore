/* eslint-disable @typescript-eslint/no-explicit-any */

import { connectToDB } from "@/lib/mongodb";
import { RazorpayRefundService } from "./razorpay-refund.service";
import Order from "@/lib/models/order.model";

interface OrderRefundRequest {
  orderId: string; // MongoDB Object ID
  reason?: string;
  userId?: string; // For validation
}

interface OrderRefundResponse {
  success: boolean;
  message: string;
  refundDetails?: {
    refundId?: string;
    refundAmount?: number;
    refundStatus?: string;
  };
  error?: any;
}

export class OrderRefundService {
  /**
   * Process refund for an order cancellation
   */
  static async processOrderCancellationRefund(
    request: OrderRefundRequest
  ): Promise<OrderRefundResponse> {
    try {
      await connectToDB();

      const {
        orderId,
        reason = "Order cancelled by customer",
        userId,
      } = request;

      // Fetch order details
      const order = await Order.findById(orderId);
      if (!order) {
        return {
          success: false,
          message: "Order not found",
        };
      }

      // Validate user ownership if userId provided
      if (userId && order.userId.toString() !== userId) {
        return {
          success: false,
          message: "Unauthorized: Order does not belong to user",
        };
      }

      // Check if order is eligible for refund
      const eligibilityCheck = this.checkRefundEligibility(order);
      if (!eligibilityCheck.eligible) {
        return {
          success: false,
          message: eligibilityCheck.reason || "Order not eligible for refund",
        };
      }

      // Check if refund has already been processed
      if (order.refundInfo?.refund_status === "processed") {
        return {
          success: false,
          message: "Refund has already been processed for this order",
        };
      }

      // Process refund based on payment method
      const refundResult = await this.processRefundByPaymentMethod(
        order,
        reason
      );

      if (!refundResult.success) {
        return {
          success: false,
          message: refundResult.message,
          error: refundResult.error,
        };
      }

      // Update order with refund information
      const updateResult = await this.updateOrderWithRefundInfo(
        order._id,
        refundResult
      );

      if (!updateResult.success) {
        console.error(
          "Failed to update order with refund info:",
          updateResult.error
        );
        // Don't fail the whole operation if update fails, as refund was processed
      }

      return {
        success: true,
        message: refundResult.message,
        refundDetails: {
          refundId: refundResult.refundId,
          refundAmount: refundResult.refundAmount,
          refundStatus: refundResult.refundStatus,
        },
      };
    } catch (error) {
      console.error("Order refund service error:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to process refund",
        error,
      };
    }
  }

  /**
   * Check if order is eligible for refund
   */
  private static checkRefundEligibility(order: any): {
    eligible: boolean;
    reason?: string;
  } {
    // Check order status - align with business requirement that users cannot cancel after 'ready to ship'
    const nonRefundableStatuses = ["ready to ship", "delivered", "returned"];
    if (nonRefundableStatuses.includes(order.status)) {
      return {
        eligible: false,
        reason: `Orders with status "${order.status}" are not eligible for automatic refund`,
      };
    }

    // Check payment status
    if (order.paymentStatus !== "paid") {
      return {
        eligible: false,
        reason: "Only paid orders are eligible for refund",
      };
    }

    // Check if payment method supports refunds
    const supportedPaymentMethods = [
      "razorpay",
      "card",
      "upi",
      "netbanking",
      "wallet",
    ];
    const paymentMethod = order.paymentOption?.toLowerCase();

    if (paymentMethod === "cash-on-delivery" || paymentMethod === "cod") {
      return {
        eligible: false,
        reason: "Cash on Delivery orders do not require refund processing",
      };
    }

    // Check if we have payment ID for Razorpay refunds
    if (paymentMethod && supportedPaymentMethods.includes(paymentMethod)) {
      if (!order.paymentInfo?.razorpay_payment_id) {
        return {
          eligible: false,
          reason: "Missing payment information required for refund processing",
        };
      }
    }

    return { eligible: true };
  }

  /**
   * Process refund based on payment method
   */
  private static async processRefundByPaymentMethod(
    order: any,
    reason: string
  ): Promise<{
    success: boolean;
    message: string;
    refundId?: string;
    refundAmount?: number;
    refundStatus?: string;
    error?: any;
  }> {
    const paymentMethod = order.paymentOption?.toLowerCase();

    // Handle COD orders (no refund needed)
    if (paymentMethod === "cash-on-delivery" || paymentMethod === "cod") {
      return {
        success: true,
        message:
          "Cash on Delivery order cancelled successfully (no refund required)",
        refundStatus: "not_applicable",
      };
    }

    // Handle Razorpay payments
    if (order.paymentInfo?.razorpay_payment_id) {
      return await this.processRazorpayRefund(order, reason);
    }

    // For other payment methods, log and mark as manual review required
    console.warn(
      `Manual refund review required for payment method: ${paymentMethod}`,
      {
        orderId: order._id,
        paymentMethod,
        amount: order.total,
      }
    );

    return {
      success: true,
      message:
        "Refund request submitted for manual processing. You will be contacted within 2-3 business days.",
      refundStatus: "manual_review",
    };
  }

  /**
   * Process Razorpay refund
   */
  private static async processRazorpayRefund(
    order: any,
    reason: string
  ): Promise<{
    success: boolean;
    message: string;
    refundId?: string;
    refundAmount?: number;
    refundStatus?: string;
    error?: any;
  }> {
    try {
      const paymentId = order.paymentInfo.razorpay_payment_id;
      const refundAmount =
        order.paymentInfo.payment_amount || order.total * 100; // Convert to paise if needed

      const refundResult = await RazorpayRefundService.processRefund({
        paymentId,
        amount: refundAmount,
        notes: {
          order_id: order.orderId,
          reason: reason,
          cancelled_at: new Date().toISOString(),
        },
        receipt: `refund_${order.orderId}_${Date.now()}`,
      });

      if (refundResult.success) {
        return {
          success: true,
          message:
            "Refund initiated successfully. Amount will be credited to your original payment method within 5-7 business days.",
          refundId: refundResult.refundId,
          refundAmount: refundResult.amount,
          refundStatus: refundResult.status,
        };
      } else {
        // Log the error but don't expose detailed error to user
        console.error("Razorpay refund failed:", refundResult);
        return {
          success: false,
          message:
            "Failed to process refund automatically. Our team will process it manually within 2-3 business days.",
          error: refundResult.error,
        };
      }
    } catch (error) {
      console.error("Razorpay refund processing error:", error);
      return {
        success: false,
        message:
          "Refund processing failed. Our team will handle this manually within 2-3 business days.",
        error,
      };
    }
  }

  /**
   * Update order with refund information
   */
  private static async updateOrderWithRefundInfo(
    orderId: string,
    refundResult: any
  ): Promise<{ success: boolean; error?: any }> {
    try {
      const updateData: any = {
        "refundInfo.refund_initiated_at": new Date(),
        "refundInfo.refund_reason":
          refundResult.reason || "Order cancelled by customer",
      };

      if (refundResult.refundId) {
        updateData["refundInfo.refund_id"] = refundResult.refundId;
      }

      if (refundResult.refundAmount) {
        updateData["refundInfo.refund_amount"] = refundResult.refundAmount;
      }

      if (refundResult.refundStatus) {
        updateData["refundInfo.refund_status"] = refundResult.refundStatus;

        // If refund is processed, update the timestamp
        if (refundResult.refundStatus === "processed") {
          updateData["refundInfo.refund_processed_at"] = new Date();
        }
      }

      await Order.findByIdAndUpdate(orderId, updateData, { new: true });

      return { success: true };
    } catch (error) {
      console.error("Failed to update order with refund info:", error);
      return { success: false, error };
    }
  }

  /**
   * Get refund status for an order
   */
  static async getOrderRefundStatus(orderId: string): Promise<{
    success: boolean;
    refundInfo?: any;
    message: string;
    error?: any;
  }> {
    try {
      await connectToDB();

      const order = await Order.findById(orderId).select(
        "refundInfo paymentInfo total orderId"
      );

      if (!order) {
        return {
          success: false,
          message: "Order not found",
        };
      }

      return {
        success: true,
        refundInfo: order.refundInfo,
        message: "Refund information retrieved successfully",
      };
    } catch (error) {
      console.error("Get order refund status error:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to get refund status",
        error,
      };
    }
  }
}

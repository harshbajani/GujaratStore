/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Razorpay Refund Service
 *
 * This service handles refund processing for Razorpay payments
 * Documentation: https://razorpay.com/docs/api/refunds/
 */

interface RefundRequest {
  paymentId: string;
  amount?: number; // Optional - if not provided, full refund is processed
  speed?: "normal" | "optimum"; // Refund speed
  notes?: Record<string, string>; // Additional notes
  receipt?: string; // Unique receipt identifier
}

interface RefundResponse {
  success: boolean;
  refundId?: string;
  amount?: number;
  status?: "processed" | "pending" | "failed";
  message: string;
  error?: any;
}

export class RazorpayRefundService {
  private static keyId = process.env.RAZORPAY_KEY_ID;
  private static keySecret = process.env.RAZORPAY_KEY_SECRET;
  private static baseUrl =
    process.env.NODE_ENV === "production"
      ? "https://api.razorpay.com/v1"
      : "https://api.razorpay.com/v1";

  /**
   * Process a refund for a Razorpay payment
   */
  static async processRefund(
    refundRequest: RefundRequest
  ): Promise<RefundResponse> {
    try {
      if (!this.keyId || !this.keySecret) {
        throw new Error("Razorpay credentials not configured");
      }

      const {
        paymentId,
        amount,
        speed = "normal",
        notes,
        receipt,
      } = refundRequest;

      // Prepare refund payload
      const refundData: any = {
        speed,
      };

      if (amount) {
        refundData.amount = amount; // Amount in paise
      }

      if (notes) {
        refundData.notes = notes;
      }

      if (receipt) {
        refundData.receipt = receipt;
      }

      // Create authorization header
      const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString(
        "base64"
      );

      // Make refund request to Razorpay
      const response = await fetch(
        `${this.baseUrl}/payments/${paymentId}/refund`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(refundData),
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        console.error("Razorpay refund failed:", responseData);
        return {
          success: false,
          message:
            responseData.error?.description || "Refund processing failed",
          error: responseData.error,
        };
      }

      return {
        success: true,
        refundId: responseData.id,
        amount: responseData.amount,
        status: this.mapRazorpayStatus(responseData.status),
        message: "Refund initiated successfully",
      };
    } catch (error) {
      console.error("Razorpay refund service error:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Refund processing failed",
        error,
      };
    }
  }

  /**
   * Check refund status
   */
  static async getRefundStatus(refundId: string): Promise<RefundResponse> {
    try {
      if (!this.keyId || !this.keySecret) {
        throw new Error("Razorpay credentials not configured");
      }

      const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString(
        "base64"
      );

      const response = await fetch(`${this.baseUrl}/refunds/${refundId}`, {
        method: "GET",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
      });

      const responseData = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message:
            responseData.error?.description || "Failed to fetch refund status",
          error: responseData.error,
        };
      }

      return {
        success: true,
        refundId: responseData.id,
        amount: responseData.amount,
        status: this.mapRazorpayStatus(responseData.status),
        message: "Refund status fetched successfully",
      };
    } catch (error) {
      console.error("Razorpay refund status check error:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to check refund status",
        error,
      };
    }
  }

  /**
   * Get all refunds for a payment
   */
  static async getPaymentRefunds(paymentId: string): Promise<{
    success: boolean;
    refunds?: any[];
    message: string;
    error?: any;
  }> {
    try {
      if (!this.keyId || !this.keySecret) {
        throw new Error("Razorpay credentials not configured");
      }

      const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString(
        "base64"
      );

      const response = await fetch(
        `${this.baseUrl}/payments/${paymentId}/refunds`,
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/json",
          },
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: responseData.error?.description || "Failed to fetch refunds",
          error: responseData.error,
        };
      }

      return {
        success: true,
        refunds: responseData.items || [],
        message: "Refunds fetched successfully",
      };
    } catch (error) {
      console.error("Razorpay payment refunds fetch error:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch payment refunds",
        error,
      };
    }
  }

  /**
   * Map Razorpay refund status to our internal status
   */
  private static mapRazorpayStatus(
    razorpayStatus: string
  ): "processed" | "pending" | "failed" {
    switch (razorpayStatus) {
      case "processed":
        return "processed";
      case "pending":
      case "created":
        return "pending";
      case "failed":
      default:
        return "failed";
    }
  }

  /**
   * Calculate refund amount in paise
   */
  static calculateRefundAmount(
    originalAmount: number,
    refundPercentage: number = 100
  ): number {
    return Math.round((originalAmount * refundPercentage) / 100);
  }

  /**
   * Validate refund request
   */
  static validateRefundRequest(refundRequest: RefundRequest): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!refundRequest.paymentId) {
      errors.push("Payment ID is required");
    }

    if (refundRequest.amount && refundRequest.amount <= 0) {
      errors.push("Refund amount must be greater than 0");
    }

    if (
      refundRequest.speed &&
      !["normal", "optimum"].includes(refundRequest.speed)
    ) {
      errors.push('Invalid refund speed. Must be "normal" or "optimum"');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

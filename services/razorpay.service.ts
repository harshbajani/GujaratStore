/* eslint-disable @typescript-eslint/no-explicit-any */
import Razorpay from "razorpay";
import crypto from "crypto";

// Razorpay Configuration
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Types
export interface RazorpayOrderOptions {
  amount: number; // Amount in paise (INR)
  currency?: string;
  receipt: string;
  notes?: Record<string, any>;
}

export interface RazorpayOrder {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  offer_id: string | null;
  status: string;
  attempts: number;
  notes: Record<string, any>;
  created_at: number;
}

export interface PaymentVerificationData {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface WebhookEvent {
  entity: string;
  account_id: string;
  event: string;
  contains: string[];
  payload: {
    payment?: {
      entity: any;
    };
    order?: {
      entity: any;
    };
  };
  created_at: number;
}

export class RazorpayService {
  /**
   * Create a Razorpay order
   */
  static async createOrder(options: RazorpayOrderOptions): Promise<ActionResponse<RazorpayOrder>> {
    try {
      // Validate inputs
      if (!options.amount || options.amount <= 0) {
        return {
          success: false,
          message: "Invalid amount specified",
        };
      }

      if (!options.receipt) {
        return {
          success: false,
          message: "Receipt is required",
        };
      }

      // Ensure amount is in paise (multiply by 100 if it's in rupees)
      const amountInPaise = Math.round(options.amount * 100);

      const orderOptions = {
        amount: amountInPaise,
        currency: options.currency || "INR",
        receipt: options.receipt,
        notes: options.notes || {},
        partial_payment: false, // Don't allow partial payments for security
      };

      const order = await razorpayInstance.orders.create(orderOptions);

      return {
        success: true,
        message: "Order created successfully",
        data: order as RazorpayOrder,
      };
    } catch (error: any) {
      console.error("Razorpay order creation error:", error);
      
      // Handle specific Razorpay errors
      if (error.statusCode) {
        return {
          success: false,
          message: `Razorpay Error: ${error.error?.description || error.message}`,
        };
      }

      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to create Razorpay order",
      };
    }
  }

  /**
   * Verify payment signature
   */
  static verifyPaymentSignature(paymentData: PaymentVerificationData): ActionResponse<boolean> {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData;

      // Validate inputs
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return {
          success: false,
          message: "Missing required payment verification data",
        };
      }

      // Create signature string
      const signatureString = `${razorpay_order_id}|${razorpay_payment_id}`;
      
      // Generate expected signature
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
        .update(signatureString)
        .digest("hex");

      // Compare signatures using crypto.timingSafeEqual for security
      const isSignatureValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, "hex"),
        Buffer.from(razorpay_signature, "hex")
      );

      return {
        success: true,
        message: isSignatureValid ? "Payment signature verified" : "Invalid payment signature",
        data: isSignatureValid,
      };
    } catch (error) {
      console.error("Payment verification error:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to verify payment",
      };
    }
  }

  /**
   * Fetch payment details from Razorpay
   */
  static async fetchPayment(paymentId: string): Promise<ActionResponse<any>> {
    try {
      if (!paymentId) {
        return {
          success: false,
          message: "Payment ID is required",
        };
      }

      const payment = await razorpayInstance.payments.fetch(paymentId);

      return {
        success: true,
        message: "Payment details fetched successfully",
        data: payment,
      };
    } catch (error: any) {
      console.error("Fetch payment error:", error);
      
      if (error.statusCode === 400) {
        return {
          success: false,
          message: "Invalid payment ID",
        };
      }

      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch payment details",
      };
    }
  }

  /**
   * Fetch order details from Razorpay
   */
  static async fetchOrder(orderId: string): Promise<ActionResponse<any>> {
    try {
      if (!orderId) {
        return {
          success: false,
          message: "Order ID is required",
        };
      }

      const order = await razorpayInstance.orders.fetch(orderId);

      return {
        success: true,
        message: "Order details fetched successfully",
        data: order,
      };
    } catch (error: any) {
      console.error("Fetch order error:", error);
      
      if (error.statusCode === 400) {
        return {
          success: false,
          message: "Invalid order ID",
        };
      }

      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch order details",
      };
    }
  }

  /**
   * Verify webhook signature for security
   */
  static verifyWebhookSignature(
    webhookBody: string,
    webhookSignature: string
  ): ActionResponse<boolean> {
    try {
      if (!webhookBody || !webhookSignature) {
        return {
          success: false,
          message: "Missing webhook body or signature",
        };
      }

      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET!;
      if (!webhookSecret) {
        return {
          success: false,
          message: "Webhook secret not configured",
        };
      }

      // Generate expected signature
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(webhookBody)
        .digest("hex");

      // Compare signatures
      const isSignatureValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, "hex"),
        Buffer.from(webhookSignature, "hex")
      );

      return {
        success: true,
        message: isSignatureValid ? "Webhook signature verified" : "Invalid webhook signature",
        data: isSignatureValid,
      };
    } catch (error) {
      console.error("Webhook verification error:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to verify webhook",
      };
    }
  }

  /**
   * Process webhook events
   */
  static async processWebhookEvent(event: WebhookEvent): Promise<ActionResponse<any>> {
    try {
      const { entity, event: eventType, payload } = event;

      console.log(`Processing webhook event: ${eventType} for entity: ${entity}`);

      switch (eventType) {
        case "payment.authorized":
          return this.handlePaymentAuthorized(payload.payment?.entity);

        case "payment.captured":
          return this.handlePaymentCaptured(payload.payment?.entity);

        case "payment.failed":
          return this.handlePaymentFailed(payload.payment?.entity);

        case "order.paid":
          return this.handleOrderPaid(payload.order?.entity);

        default:
          return {
            success: true,
            message: `Webhook event ${eventType} received but not processed`,
          };
      }
    } catch (error) {
      console.error("Webhook processing error:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to process webhook",
      };
    }
  }

  /**
   * Handle payment authorized event
   */
  private static async handlePaymentAuthorized(paymentData: any): Promise<ActionResponse<any>> {
    try {
      console.log("Payment authorized:", paymentData);
      
      // You can implement custom logic here
      // For example, update order status, send notifications, etc.
      
      return {
        success: true,
        message: "Payment authorized event processed",
        data: paymentData,
      };
    } catch (error) {
      console.error("Handle payment authorized error:", error);
      return {
        success: false,
        message: "Failed to handle payment authorized event",
      };
    }
  }

  /**
   * Handle payment captured event
   */
  private static async handlePaymentCaptured(paymentData: any): Promise<ActionResponse<any>> {
    try {
      console.log("Payment captured:", paymentData);
      
      // You can implement custom logic here
      // For example, fulfill order, update inventory, send confirmation email, etc.
      
      return {
        success: true,
        message: "Payment captured event processed",
        data: paymentData,
      };
    } catch (error) {
      console.error("Handle payment captured error:", error);
      return {
        success: false,
        message: "Failed to handle payment captured event",
      };
    }
  }

  /**
   * Handle payment failed event
   */
  private static async handlePaymentFailed(paymentData: any): Promise<ActionResponse<any>> {
    try {
      console.log("Payment failed:", paymentData);
      
      // You can implement custom logic here
      // For example, notify user, retry payment, update order status, etc.
      
      return {
        success: true,
        message: "Payment failed event processed",
        data: paymentData,
      };
    } catch (error) {
      console.error("Handle payment failed error:", error);
      return {
        success: false,
        message: "Failed to handle payment failed event",
      };
    }
  }

  /**
   * Handle order paid event
   */
  private static async handleOrderPaid(orderData: any): Promise<ActionResponse<any>> {
    try {
      console.log("Order paid:", orderData);
      
      // You can implement custom logic here
      // For example, mark order as paid, trigger fulfillment, etc.
      
      return {
        success: true,
        message: "Order paid event processed",
        data: orderData,
      };
    } catch (error) {
      console.error("Handle order paid error:", error);
      return {
        success: false,
        message: "Failed to handle order paid event",
      };
    }
  }

  /**
   * Get Razorpay key ID for frontend
   */
  static getRazorpayKeyId(): string {
    return process.env.RAZORPAY_KEY_ID || "";
  }

  /**
   * Validate Razorpay configuration
   */
  static validateConfiguration(): ActionResponse<boolean> {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!keyId || !keySecret) {
      return {
        success: false,
        message: "Razorpay Key ID and Key Secret are required",
      };
    }

    if (!webhookSecret) {
      console.warn("Warning: RAZORPAY_WEBHOOK_SECRET not configured. Webhook verification will fail.");
    }

    return {
      success: true,
      message: "Razorpay configuration is valid",
      data: true,
    };
  }
}

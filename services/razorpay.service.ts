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

      // Ensure amount is in paise (multiply by 100 as Razorpay expects amount in paise)
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
      
      // Extract order ID from payment notes to identify our order
      const orderId = paymentData.notes?.orderId;
      
      if (orderId) {
        // Update order payment status to failed
        try {
          const updateResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_BASE_URL}/api/order/update/${orderId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              paymentStatus: 'failed',
              paymentInfo: {
                razorpay_payment_id: paymentData.id,
                payment_status: paymentData.status,
                payment_method: paymentData.method,
                payment_amount: paymentData.amount,
                error_code: paymentData.error_code,
                error_description: paymentData.error_description,
                verified_at: new Date().toISOString(),
              }
            })
          });
          
          if (updateResponse.ok) {
            console.log(`Order ${orderId} payment status updated to failed`);
            
            // Send payment failure email
            const failureReason = this.getFailureReason(paymentData);
            await this.sendPaymentFailureNotification(orderId, failureReason);
          }
        } catch (updateError) {
          console.error('Failed to update order payment status:', updateError);
        }
      }
      
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
   * Get user-friendly failure reason
   */
  private static getFailureReason(paymentData: any): string {
    const errorCode = paymentData.error_code;
    const errorDescription = paymentData.error_description;
    
    // Map common error codes to user-friendly messages
    const errorMappings: { [key: string]: string } = {
      'PAYMENT_FAILED': 'Payment was declined by your bank. Please check your card details and try again.',
      'GATEWAY_ERROR': 'There was a technical issue with the payment gateway. Please try again.',
      'CARD_EXPIRED': 'Your card has expired. Please use a different card.',
      'INSUFFICIENT_FUNDS': 'Insufficient funds in your account. Please check your balance and try again.',
      'INVALID_CARD': 'Invalid card details. Please check your card number, expiry date, and CVV.',
      'AUTHENTICATION_FAILED': 'Card authentication failed. Please verify your card details.',
      'TRANSACTION_TIMEOUT': 'Transaction timed out. Please try again.',
      'INVALID_CVV': 'Invalid CVV number. Please check and try again.',
      'CARD_BLOCKED': 'Your card is blocked. Please contact your bank.',
      'NETWORK_ERROR': 'Network error occurred. Please check your internet connection and try again.',
    };
    
    return errorMappings[errorCode] || errorDescription || 'Payment failed due to an unknown error. Please try again or contact support.';
  }
  
  /**
   * Send payment failure notification
   */
  private static async sendPaymentFailureNotification(orderId: string, failureReason: string): Promise<void> {
    try {
      // First get order details to prepare email data
      const orderResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_BASE_URL}/api/order/${orderId}`);
      
      if (!orderResponse.ok) {
        throw new Error('Failed to fetch order details');
      }
      
      const orderData = await orderResponse.json();
      
      if (orderData.success && orderData.order) {
        const order = orderData.order;
        
        // Send payment failure email
        await fetch(`${process.env.NEXT_PUBLIC_APP_BASE_URL}/api/payment-failure-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: order.orderId,
            items: order.items,
            subtotal: order.subtotal,
            deliveryCharges: order.deliveryCharges,
            discountAmount: order.discountAmount || 0,
            total: order.total,
            paymentOption: order.paymentOption,
            createdAt: order.createdAt,
            userName: 'Customer', // Will be populated from order details
            userEmail: order.userEmail || 'customer@example.com', // Will be populated from order details
            paymentFailureReason: failureReason,
          })
        });
        
        console.log(`Payment failure email sent for order ${orderId}`);
      }
    } catch (error) {
      console.error('Failed to send payment failure notification:', error);
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

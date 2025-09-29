/* eslint-disable @typescript-eslint/no-explicit-any */
import { SHIPROCKET_CONFIG } from "./config";
import { ShiprocketHttpClient } from "./http-client";
import { ShiprocketAuth } from "./auth";
import {
  ShiprocketOrderRequest,
  ShiprocketOrderResponse,
  ShiprocketAPIResponse,
} from "./types";

/**
 * Shiprocket Orders Module
 * Handles order creation, cancellation, and management
 */
export class ShiprocketOrders {
  private httpClient: ShiprocketHttpClient;
  private auth: ShiprocketAuth;

  constructor(httpClient?: ShiprocketHttpClient, auth?: ShiprocketAuth) {
    this.httpClient = httpClient || new ShiprocketHttpClient();
    this.auth = auth || new ShiprocketAuth(this.httpClient);
  }

  /**
   * Create order in Shiprocket
   */
  async createOrder(
    orderData: ShiprocketOrderRequest
  ): Promise<ShiprocketAPIResponse<ShiprocketOrderResponse>> {
    try {
      console.log(`[Shiprocket Orders] Creating order: ${orderData.order_id}`);

      const token = await this.auth.getToken();
      if (!token) {
        return {
          success: false,
          error: {
            message: "Authentication failed",
            status: 401,
            statusText: "Unauthorized",
          },
        };
      }

      const response = await this.httpClient.post<ShiprocketOrderResponse>(
        SHIPROCKET_CONFIG.ENDPOINTS.CREATE_ORDER,
        orderData,
        token
      );

      if (response.success) {
        console.log(
          `[Shiprocket Orders] Order created successfully: ${orderData.order_id}`
        );
      } else {
        console.error(
          `[Shiprocket Orders] Failed to create order: ${orderData.order_id}`,
          response.error
        );
      }

      return response;
    } catch (error) {
      console.error("[Shiprocket Orders] Error creating order:", error);

      return {
        success: false,
        error: {
          message:
            error instanceof Error ? error.message : "Failed to create order",
          status: 500,
          statusText: "Internal Server Error",
          response: error,
        },
      };
    }
  }

  /**
   * Cancel Shiprocket orders
   */
  async cancelOrders(orderIds: number[]): Promise<ShiprocketAPIResponse<any>> {
    try {
      console.log(`[Shiprocket Orders] Cancelling orders:`, orderIds);

      const token = await this.auth.getToken();
      if (!token) {
        return {
          success: false,
          error: {
            message: "Authentication failed",
            status: 401,
            statusText: "Unauthorized",
          },
        };
      }

      const response = await this.httpClient.post(
        SHIPROCKET_CONFIG.ENDPOINTS.CANCEL_ORDER,
        { ids: orderIds },
        token
      );

      if (response.success) {
        console.log(
          `[Shiprocket Orders] Orders cancelled successfully:`,
          orderIds
        );
      } else {
        console.error(
          `[Shiprocket Orders] Failed to cancel orders:`,
          orderIds,
          response.error
        );
      }

      return response;
    } catch (error) {
      console.error("[Shiprocket Orders] Error cancelling orders:", error);

      return {
        success: false,
        error: {
          message:
            error instanceof Error ? error.message : "Failed to cancel orders",
          status: 500,
          statusText: "Internal Server Error",
          response: error,
        },
      };
    }
  }

  /**
   * Generate pickup for orders
   */
  async generatePickup(
    orderIds: number[]
  ): Promise<ShiprocketAPIResponse<any>> {
    try {
      console.log(
        `[Shiprocket Orders] Generating pickup for orders:`,
        orderIds
      );

      const token = await this.auth.getToken();
      if (!token) {
        return {
          success: false,
          error: {
            message: "Authentication failed",
            status: 401,
            statusText: "Unauthorized",
          },
        };
      }

      const response = await this.httpClient.post(
        SHIPROCKET_CONFIG.ENDPOINTS.GENERATE_PICKUP,
        { shipment_id: orderIds },
        token
      );

      if (response.success) {
        console.log(
          `[Shiprocket Orders] Pickup generated successfully:`,
          orderIds
        );
      } else {
        console.error(
          `[Shiprocket Orders] Failed to generate pickup:`,
          orderIds,
          response.error
        );
      }

      return response;
    } catch (error) {
      console.error("[Shiprocket Orders] Error generating pickup:", error);

      return {
        success: false,
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Failed to generate pickup",
          status: 500,
          statusText: "Internal Server Error",
          response: error,
        },
      };
    }
  }

  /**
   * Format order data from your system to Shiprocket format
   */
  formatOrderForShiprocket(
    order: any,
    address: any,
    user: any,
    vendorData?: any
  ): ShiprocketOrderRequest {
    // Calculate total weight and dimensions from products
    const totalWeight = order.items.reduce((weight: number, item: any) => {
      const itemWeight = item.appliedWeight || item.deadWeight || SHIPROCKET_CONFIG.DEFAULT_DIMENSIONS.weight;
      return weight + (item.quantity * itemWeight);
    }, 0);

    // Calculate maximum dimensions from all items
    let maxLength = SHIPROCKET_CONFIG.DEFAULT_DIMENSIONS.length;
    let maxWidth = SHIPROCKET_CONFIG.DEFAULT_DIMENSIONS.breadth;
    let maxHeight = SHIPROCKET_CONFIG.DEFAULT_DIMENSIONS.height;
    
    order.items.forEach((item: any) => {
      if (item.dimensions) {
        maxLength = Math.max(maxLength, item.dimensions.length || SHIPROCKET_CONFIG.DEFAULT_DIMENSIONS.length);
        maxWidth = Math.max(maxWidth, item.dimensions.width || SHIPROCKET_CONFIG.DEFAULT_DIMENSIONS.breadth);
        maxHeight = Math.max(maxHeight, item.dimensions.height || SHIPROCKET_CONFIG.DEFAULT_DIMENSIONS.height);
      }
    });

    // Determine pickup location based on vendor or use default
    let pickupLocation = vendorData?.shiprocket_pickup_location;

    if (!pickupLocation && vendorData) {
      // Generate pickup location name with 36 character limit
      const storeName = vendorData?.store?.storeName || "Store";
      const vendorId = vendorData?._id || "default";
      let baseName = `${storeName}_${vendorId}`.replace(/[^a-zA-Z0-9_]/g, "_");

      // Enforce 36 character limit (Shiprocket requirement)
      if (baseName.length > 36) {
        const vendorIdSuffix = vendorId.slice(-8);
        const maxStoreNameLength = 36 - vendorIdSuffix.length - 1;
        const truncatedStoreName = storeName.slice(0, maxStoreNameLength);
        baseName = `${truncatedStoreName}_${vendorIdSuffix}`.replace(
          /[^a-zA-Z0-9_]/g,
          "_"
        );

        if (baseName.length > 36) {
          baseName = baseName.slice(0, 36);
        }
      }

      pickupLocation = baseName;
    }

    if (!pickupLocation) {
      pickupLocation = SHIPROCKET_CONFIG.DEFAULT_PICKUP_LOCATION;
    }

    return {
      order_id: order.orderId,
      order_date: new Date(order.createdAt).toISOString().split("T")[0], // YYYY-MM-DD format
      pickup_location: pickupLocation,
      channel_id: SHIPROCKET_CONFIG.DEFAULT_CHANNEL_ID,
      comment: `Order from Gujarat Store - ${order.orderId}`,

      // Billing address
      billing_customer_name:
        address.name?.split(" ")[0] ||
        address.name ||
        user.name?.split(" ")[0] ||
        "Customer",
      billing_last_name:
        address.name?.split(" ").slice(1).join(" ") ||
        user.name?.split(" ").slice(1).join(" ") ||
        "",
      billing_address: address.address_line_1 || "",
      billing_address_2: address.address_line_2 || "",
      billing_city: address.locality || address.city || "",
      billing_pincode: address.pincode || address.pin_code || "",
      billing_state: address.state || "",
      billing_country: "India",
      billing_email: user.email || "",
      billing_phone: address.contact || user.phone || "",

      // Shipping address (explicitly provide even if same as billing for better compatibility)
      shipping_is_billing: false,
      shipping_customer_name:
        address.name?.split(" ")[0] ||
        address.name ||
        user.name?.split(" ")[0] ||
        "Customer",
      shipping_last_name:
        address.name?.split(" ").slice(1).join(" ") ||
        user.name?.split(" ").slice(1).join(" ") ||
        "",
      shipping_address: address.address_line_1 || "",
      shipping_address_2: address.address_line_2 || "",
      shipping_city: address.locality || address.city || "",
      shipping_pincode: address.pincode || address.pin_code || "",
      shipping_state: address.state || "",
      shipping_country: "India",
      shipping_email: user.email || "",
      shipping_phone: address.contact || user.phone || "",

      // Order items
      order_items: order.items.map((item: any) => ({
        name: item.productName,
        sku: item.productId,
        units: item.quantity,
        selling_price: item.price,
        discount: 0,
        tax: 0,
        hsn: 0,
        category: item.secondaryCategory?.name || "General", // Use secondary category name
      })),

      // Payment and pricing
      payment_method:
        order.paymentOption === "cash-on-delivery" ? "COD" : "Prepaid",
      shipping_charges: order.deliveryCharges,
      giftwrap_charges: 0,
      transaction_charges: 0,
      total_discount: order.discountAmount || 0,
      sub_total: order.subtotal,

      // Package dimensions - use calculated values from products
      length: Math.round(maxLength),
      breadth: Math.round(maxWidth),
      height: Math.round(maxHeight),
      weight: Math.max(totalWeight, 0.5), // Minimum weight of 0.5kg
    };
  }

  /**
   * Map Shiprocket status to your system status
   */
  mapStatusToSystem(shiprocketStatus: string): string {
    const status = shiprocketStatus.toUpperCase();
    return SHIPROCKET_CONFIG.STATUS_MAPPING[status] || "processing";
  }

  /**
   * Check if status change should trigger email notification
   */
  shouldNotifyUser(shiprocketStatus: string): boolean {
    const status = shiprocketStatus.toUpperCase();
    return Object.keys(SHIPROCKET_CONFIG.NOTIFICATION_MAPPING).includes(status);
  }

  /**
   * Get notification type for email
   */
  getNotificationType(shiprocketStatus: string): string | null {
    const status = shiprocketStatus.toUpperCase();
    return SHIPROCKET_CONFIG.NOTIFICATION_MAPPING[status] || null;
  }
}

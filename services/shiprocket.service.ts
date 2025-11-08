/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Shiprocket Service - Clean Implementation
 * This is a thin wrapper around the new modular Shiprocket SDK
 * Maintains backward compatibility while providing clean architecture
 */

// Import types but not the SDK
import type {
  ShiprocketOrderRequest,
  ShiprocketOrderResponse,
  ShiprocketTrackingResponse,
  ShiprocketPickupLocationRequest,
} from '@/lib/shiprocket/types';

// Export legacy interfaces for backward compatibility
export type {
  ShiprocketAuthResponse,
  ShiprocketOrderItem,
  ShiprocketWebhookPayload,
} from '@/lib/shiprocket/types';

export class ShiprocketService {
  private static instance: ShiprocketService;
  private backend = process.env.NEXT_PUBLIC_SHIPROCKET_BACKEND_URL || process.env.SHIPROCKET_BACKEND_URL || "http://localhost:8000";

  private async fetchJSON<T>(path: string, init?: RequestInit): Promise<T> {
    const url = `${this.backend}${path}`;
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
      ...init,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || (data && data.success === false)) {
      const msg = (data && (data.error || data.message)) || `Request failed: ${res.status}`;
      throw new Error(msg);
    }
    return data as T;
  }

  private constructor() {}

  public static getInstance(): ShiprocketService {
    if (!ShiprocketService.instance) {
      ShiprocketService.instance = new ShiprocketService();
    }
    return ShiprocketService.instance;
  }

  /**
   * Create order in Shiprocket via backend
   */
  async createOrder(orderData: ShiprocketOrderRequest): Promise<ShiprocketOrderResponse> {
    const response = await this.fetchJSON<{ success: boolean; data: ShiprocketOrderResponse }>(
      '/shiprocket/orders',
      { method: 'POST', body: JSON.stringify(orderData) }
    );
    return response.data;
  }

  /**
   * Create order via backend with context: order + vendor + optional custom pickup location
   */
  async createOrderWithContext(params: {
    order: ShiprocketOrderRequest;
    vendor?: any;
    customPickupLocation?: any;
  }): Promise<ShiprocketOrderResponse> {
    if (!this.backend) throw new Error('SHIPROCKET_BACKEND_URL is not configured');
    // Backend expects raw ShiprocketOrderRequest as the body
    const resp = await this.fetchJSON<{ success: boolean; data: ShiprocketOrderResponse }>(
      '/shiprocket/orders',
      { method: 'POST', body: JSON.stringify(params.order) }
    );
    return resp.data as ShiprocketOrderResponse;
  }

  /**
   * Track order by AWB code
   */
  async trackOrderByAWB(awbCode: string): Promise<ShiprocketTrackingResponse> {
    const response = await this.fetchJSON<{ success: boolean; data: ShiprocketTrackingResponse }>(
      `/shiprocket/tracking/awb/${awbCode}`,
      { method: 'GET' }
    );
    return response.data;
  }

  /**
   * Track order by Shiprocket order ID
   */
  async trackOrderById(orderId: number): Promise<ShiprocketTrackingResponse> {
    const response = await this.fetchJSON<{ success: boolean; data: ShiprocketTrackingResponse }>(
      `/shiprocket/tracking/order/${orderId}`,
      { method: 'GET' }
    );
    return response.data;
  }

  /**
   * Cancel Shiprocket orders
   */
  async cancelOrder(orderIds: number[]): Promise<any> {
    const response = await this.fetchJSON<{ success: boolean; data: any }>(
      '/shiprocket/orders/cancel',
      { method: 'POST', body: JSON.stringify({ ids: orderIds }) }
    );
    return response.data;
  }

  /**
   * Add pickup location via backend
   */
  async addPickupLocation(locationData: ShiprocketPickupLocationRequest): Promise<any> {
    const resp = await this.fetchJSON<{ success: boolean; data: any }>(
      '/shiprocket/pickups',
      { method: 'POST', body: JSON.stringify(locationData) }
    );
    return resp.data;
  }

  /**
   * Get all pickup locations via backend
   */
  async getPickupLocations(): Promise<any> {
    const resp = await this.fetchJSON<{ success: boolean; data: any }>(
      '/shiprocket/pickups',
      { method: 'GET' }
    );
    return resp.data;
  }

  /**
   * Update pickup location for vendor via backend (expects vendor with store.addresses)
   */
  async updateVendorPickupLocation(vendor: any, oldLocationName?: string): Promise<{ success: boolean; location_name?: string; error?: string; updated?: boolean }> {
    // Backend expects the vendor object at the root of the body
    const vendorPayload = {
      _id: vendor?._id,
      name: vendor?.name,
      email: vendor?.email,
      shiprocket_pickup_location: vendor?.shiprocket_pickup_location,
      oldLocationName, // Include old location name for updating
      store: {
        contact: vendor?.store?.contact,
        // Accept both store.address or store.addresses shapes
        address: vendor?.store?.address,
        addresses: vendor?.store?.addresses || vendor?.store?.address || null,
      },
    };

    const resp = await this.fetchJSON<{ success: boolean; location_name?: string; error?: string; updated?: boolean }>(
      '/shiprocket/pickups/vendor/update',
      { method: 'POST', body: JSON.stringify(vendorPayload) }
    );
    return resp;
  }

  /**
   * Create pickup location for vendor via backend (expects vendor with store.addresses)
   */
  async createVendorPickupLocation(vendor: any): Promise<{ success: boolean; location_name?: string; error?: string }> {
    // Backend expects the vendor object at the root of the body
    const vendorPayload = {
      _id: vendor?._id,
      name: vendor?.name,
      email: vendor?.email,
      shiprocket_pickup_location: vendor?.shiprocket_pickup_location,
      store: {
        contact: vendor?.store?.contact,
        // Accept both store.address or store.addresses shapes
        address: vendor?.store?.address,
        addresses: vendor?.store?.addresses || vendor?.store?.address || null,
      },
    };

    const resp = await this.fetchJSON<{ success: boolean; location_name?: string; error?: string }>(
      '/shiprocket/pickups/vendor',
      { method: 'POST', body: JSON.stringify(vendorPayload) }
    );
    return resp;
  }

  /**
   * Calculate shipping rates via backend
   */
  async calculateShippingRates(rateData: any): Promise<any> {
    const response = await this.fetchJSON<{ success: boolean; data: any }>(
      '/shiprocket/rates/calculate',
      { method: 'POST', body: JSON.stringify(rateData) }
    );
    return response.data;
  }

  /**
   * Apply shipping rate via backend
   */
  async applyShippingRate(rateData: any): Promise<any> {
    const response = await this.fetchJSON<{ success: boolean; data: any }>(
      '/shiprocket/apply-rate',
      { method: 'POST', body: JSON.stringify(rateData) }
    );
    return response.data;
  }

  /**
   * Advanced tracking with email support
   */
  async trackOrderAdvanced(id: string, type: string = 'order', sendEmail: boolean = false): Promise<any> {
    const params = new URLSearchParams({ type, sendEmail: sendEmail.toString() });
    const response = await this.fetchJSON<{ success: boolean; data: any }>(
      `/shiprocket/track/${id}?${params.toString()}`,
      { method: 'GET' }
    );
    return response.data;
  }

  /**
   * Format order data from your system to Shiprocket format
   * This needs to be kept in frontend since it has access to order structure
   */
  formatOrderForShiprocket(
    order: any,
    address: any,
    user: any,
    vendorData?: any
  ): ShiprocketOrderRequest {
    console.log("[ShiprocketService] Formatting order for Shiprocket:", {
      orderId: order.orderId,
      itemCount: order.items?.length,
      hasProductData: order.items?.[0]?.productData ? "Yes" : "No",
    });

    // Calculate total weight and dimensions from products
    let totalWeight = 0;
    let maxLength = 10; // Default dimensions
    let maxWidth = 10;
    let maxHeight = 10;

    if (order.items) {
      order.items.forEach((item: any) => {
        // Direct access to populated product data (productId is populated object)
        let itemWeight = 0.5; // Default weight
        let itemLength = 10;
        let itemWidth = 10;
        let itemHeight = 10;

        // Check if productId is populated (object vs string)
        if (item.productId && typeof item.productId === "object") {
          const product = item.productId;

          // Get weight (appliedWeight takes precedence over deadWeight)
          itemWeight = product.appliedWeight || product.deadWeight || 0.5;

          // Get dimensions
          if (product.dimensions) {
            itemLength = product.dimensions.length || 10;
            itemWidth = product.dimensions.width || 10;
            itemHeight = product.dimensions.height || 10;
          }
        }

        // Update maximum dimensions for the package
        maxLength = Math.max(maxLength, itemLength);
        maxWidth = Math.max(maxWidth, itemWidth);
        maxHeight = Math.max(maxHeight, itemHeight);

        // Add to total weight
        totalWeight += (item.quantity || 1) * itemWeight;
      });
    }

    // Ensure minimum weight and valid number
    totalWeight = isNaN(totalWeight) || totalWeight <= 0 ? 0.5 : Math.max(totalWeight, 0.5);

    // Ensure dimensions are valid numbers
    maxLength = isNaN(maxLength) || maxLength <= 0 ? 10 : maxLength;
    maxWidth = isNaN(maxWidth) || maxWidth <= 0 ? 10 : maxWidth;
    maxHeight = isNaN(maxHeight) || maxHeight <= 0 ? 10 : maxHeight;

    console.log("[ShiprocketService] Calculated totals:", {
      totalWeight: totalWeight + "kg",
      dimensions: `${Math.round(maxLength)}x${Math.round(maxWidth)}x${Math.round(maxHeight)}cm`,
    });

    // Determine pickup location
    let pickupLocation = vendorData?.shiprocket_pickup_location;

    if (!pickupLocation && vendorData) {
      // Generate pickup location name with 36 character limit - prioritize actual store name
      let storeName = vendorData?.store?.storeName || 
                     vendorData?.storeName || 
                     vendorData?.name || 
                     "Store";
      
      // Clean and format the store name
      storeName = storeName.trim().replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_");
      
      // If still empty, use vendor name as fallback
      if (!storeName || storeName === "_" || storeName.length === 0) {
        storeName = (vendorData?.name || "Store").trim().replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_");
      }
      
      const vendorId = vendorData?._id || "default";
      const vendorIdSuffix = vendorId.toString().slice(-8); // Last 8 characters
      
      // Calculate available space for store name (36 total - 1 underscore - 8 vendor suffix)
      const maxStoreNameLength = 36 - 1 - vendorIdSuffix.length;
      
      // Truncate store name if needed
      if (storeName.length > maxStoreNameLength) {
        storeName = storeName.slice(0, maxStoreNameLength);
      }
      
      // Build final name: StoreName_VendorId
      let baseName = `${storeName}_${vendorIdSuffix}`.replace(/[^a-zA-Z0-9_]/g, "_");
      
      // Final safety check for 36 character limit
      pickupLocation = baseName.length > 36 ? baseName.slice(0, 36) : baseName;
    }

    if (!pickupLocation) {
      pickupLocation = "The_Gujarat_Store_67b331ad";
    }

    return {
      order_id: order.orderId,
      order_date: new Date(order.createdAt).toISOString().split("T")[0], // YYYY-MM-DD format
      pickup_location: pickupLocation,
      channel_id: "custom",
      comment: `Order from Gujarat Store - ${order.orderId}`,

      // Billing address
      billing_customer_name: address.name?.split(" ")[0] || address.name || user.name?.split(" ")[0] || "Customer",
      billing_last_name: address.name?.split(" ").slice(1).join(" ") || user.name?.split(" ").slice(1).join(" ") || "",
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
      shipping_customer_name: address.name?.split(" ")[0] || address.name || user.name?.split(" ")[0] || "Customer",
      shipping_last_name: address.name?.split(" ").slice(1).join(" ") || user.name?.split(" ").slice(1).join(" ") || "",
      shipping_address: address.address_line_1 || "",
      shipping_address_2: address.address_line_2 || "",
      shipping_city: address.locality || address.city || "",
      shipping_pincode: address.pincode || address.pin_code || "",
      shipping_state: address.state || "",
      shipping_country: "India",
      shipping_email: user.email || "",
      shipping_phone: address.contact || user.phone || "",

      // Order items - direct access to order item fields
      order_items: (order.items || []).map((item: any) => {
        // Use the productId as SKU - if it's populated, get the _id, otherwise use as-is
        const itemSku = typeof item.productId === "object" && item.productId._id
          ? item.productId._id.toString()
          : item.productId ? item.productId.toString() : "SKU";

        return {
          name: item.productName || "Product",
          sku: itemSku,
          units: item.quantity || 1,
          selling_price: item.price || 0,
          discount: 0,
          tax: 0,
          hsn: 0,
        };
      }),

      // Payment and pricing
      payment_method: order.paymentOption === "cash-on-delivery" ? "COD" : "Prepaid",
      shipping_charges: order.deliveryCharges || 0,
      giftwrap_charges: 0,
      transaction_charges: 0,
      total_discount: order.discountAmount || 0,
      sub_total: order.subtotal || order.total || 0,

      // Package dimensions - use calculated values from products
      length: Math.round(maxLength),
      breadth: Math.round(maxWidth),
      height: Math.round(maxHeight),
      weight: Math.max(totalWeight, 0.5), // Minimum weight of 0.5kg
    };
  }

  /**
   * Map Shiprocket status to your system status
   * Basic mapping - can be enhanced or moved to backend
   */
  mapStatusToSystem(shiprocketStatus: string): string {
    const statusMapping: Record<string, string> = {
      'NEW': 'ready to ship',
      'PICKUP_SCHEDULED': 'ready to ship',
      'PICKUP_GENERATED': 'ready to ship',
      'PICKED_UP': 'shipped',
      'IN_TRANSIT': 'shipped',
      'OUT_FOR_DELIVERY': 'out for delivery',
      'DELIVERED': 'delivered',
      'CANCELLED': 'cancelled',
      'LOST': 'cancelled',
      'DAMAGED': 'returned',
      'RETURNED': 'returned',
      'RTO_INITIATED': 'returned',
      'RTO_DELIVERED': 'returned',
    };
    return statusMapping[shiprocketStatus.toUpperCase()] || 'processing';
  }

  /**
   * Check if status change should trigger email notification
   */
  shouldNotifyUser(shiprocketStatus: string): boolean {
    const notificationStatuses = ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'];
    return notificationStatuses.includes(shiprocketStatus.toUpperCase());
  }

  /**
   * Get notification type for email
   */
  getNotificationType(shiprocketStatus: string): string | null {
    const notificationMapping: Record<string, string> = {
      'PICKED_UP': 'shipped',
      'IN_TRANSIT': 'in_transit',
      'OUT_FOR_DELIVERY': 'out_for_delivery',
      'DELIVERED': 'delivered',
    };
    return notificationMapping[shiprocketStatus.toUpperCase()] || null;
  }

  /**
   * Check authentication status via backend
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const response = await this.fetchJSON<{ success: boolean; token: any }>(
        '/shiprocket/auth/status',
        { method: 'GET' }
      );
      return response.success && !!response.token;
    } catch {
      return false;
    }
  }

  /**
   * Get token info for debugging via backend
   */
  async getTokenInfo() {
    try {
      const response = await this.fetchJSON<{ success: boolean; token: any }>(
        '/shiprocket/auth/status',
        { method: 'GET' }
      );
      return response.token;
    } catch {
      return null;
    }
  }
}

// Export types for backward compatibility
export type {
  ShiprocketOrderRequest,
  ShiprocketOrderResponse,
  ShiprocketTrackingResponse,
  ShiprocketPickupLocationRequest,
} from '@/lib/shiprocket/types';

import { SHIPROCKET_CONFIG } from './config';
import { ShiprocketHttpClient } from './http-client';
import { ShiprocketAuth } from './auth';
import {
  ShiprocketOrderRequest,
  ShiprocketOrderResponse,
  ShiprocketAPIResponse,
} from './types';

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
            message: 'Authentication failed',
            status: 401,
            statusText: 'Unauthorized',
          },
        };
      }

      const response = await this.httpClient.post<ShiprocketOrderResponse>(
        SHIPROCKET_CONFIG.ENDPOINTS.CREATE_ORDER,
        orderData,
        token
      );

      if (response.success) {
        console.log(`[Shiprocket Orders] Order created successfully: ${orderData.order_id}`);
      } else {
        console.error(`[Shiprocket Orders] Failed to create order: ${orderData.order_id}`, response.error);
      }

      return response;
    } catch (error) {
      console.error('[Shiprocket Orders] Error creating order:', error);
      
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to create order',
          status: 500,
          statusText: 'Internal Server Error',
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
            message: 'Authentication failed',
            status: 401,
            statusText: 'Unauthorized',
          },
        };
      }

      const response = await this.httpClient.post(
        SHIPROCKET_CONFIG.ENDPOINTS.CANCEL_ORDER,
        { ids: orderIds },
        token
      );

      if (response.success) {
        console.log(`[Shiprocket Orders] Orders cancelled successfully:`, orderIds);
      } else {
        console.error(`[Shiprocket Orders] Failed to cancel orders:`, orderIds, response.error);
      }

      return response;
    } catch (error) {
      console.error('[Shiprocket Orders] Error cancelling orders:', error);
      
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to cancel orders',
          status: 500,
          statusText: 'Internal Server Error',
          response: error,
        },
      };
    }
  }

  /**
   * Generate pickup for orders
   */
  async generatePickup(orderIds: number[]): Promise<ShiprocketAPIResponse<any>> {
    try {
      console.log(`[Shiprocket Orders] Generating pickup for orders:`, orderIds);

      const token = await this.auth.getToken();
      if (!token) {
        return {
          success: false,
          error: {
            message: 'Authentication failed',
            status: 401,
            statusText: 'Unauthorized',
          },
        };
      }

      const response = await this.httpClient.post(
        SHIPROCKET_CONFIG.ENDPOINTS.GENERATE_PICKUP,
        { shipment_id: orderIds },
        token
      );

      if (response.success) {
        console.log(`[Shiprocket Orders] Pickup generated successfully:`, orderIds);
      } else {
        console.error(`[Shiprocket Orders] Failed to generate pickup:`, orderIds, response.error);
      }

      return response;
    } catch (error) {
      console.error('[Shiprocket Orders] Error generating pickup:', error);
      
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to generate pickup',
          status: 500,
          statusText: 'Internal Server Error',
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
    // Calculate total weight and dimensions
    const totalWeight = order.items.reduce((weight: number, item: any) => {
      return weight + item.quantity * SHIPROCKET_CONFIG.DEFAULT_DIMENSIONS.weight;
    }, 0);

    // Determine pickup location based on vendor or use default
    const pickupLocation = vendorData?.shiprocket_pickup_location || 
                          `${vendorData?.store?.storeName || 'Store'}_${vendorData?._id || 'default'}`.replace(/[^a-zA-Z0-9_]/g, '_') || 
                          SHIPROCKET_CONFIG.DEFAULT_PICKUP_LOCATION;

    return {
      order_id: order.orderId,
      order_date: new Date(order.createdAt).toISOString().split('T')[0], // YYYY-MM-DD format
      pickup_location: pickupLocation,
      channel_id: SHIPROCKET_CONFIG.DEFAULT_CHANNEL_ID,
      comment: `Order from Gujarat Store - ${order.orderId}`,

      // Billing address
      billing_customer_name: address.name.split(' ')[0] || address.name,
      billing_last_name: address.name.split(' ').slice(1).join(' ') || '',
      billing_address: address.address_line_1,
      billing_address_2: address.address_line_2 || '',
      billing_city: address.locality,
      billing_pincode: address.pincode,
      billing_state: address.state,
      billing_country: 'India',
      billing_email: user.email,
      billing_phone: address.contact,

      // Shipping address (same as billing)
      shipping_is_billing: true,

      // Order items
      order_items: order.items.map((item: any) => ({
        name: item.productName,
        sku: item.productId,
        units: item.quantity,
        selling_price: item.price,
        discount: 0,
        tax: 0,
        hsn: 0,
      })),

      // Payment and pricing
      payment_method: order.paymentOption === 'cash-on-delivery' ? 'COD' : 'Prepaid',
      shipping_charges: order.deliveryCharges,
      giftwrap_charges: 0,
      transaction_charges: 0,
      total_discount: order.discountAmount || 0,
      sub_total: order.subtotal,

      // Package dimensions
      length: SHIPROCKET_CONFIG.DEFAULT_DIMENSIONS.length,
      breadth: SHIPROCKET_CONFIG.DEFAULT_DIMENSIONS.breadth,
      height: SHIPROCKET_CONFIG.DEFAULT_DIMENSIONS.height,
      weight: totalWeight,
    };
  }

  /**
   * Map Shiprocket status to your system status
   */
  mapStatusToSystem(shiprocketStatus: string): string {
    const status = shiprocketStatus.toUpperCase();
    return SHIPROCKET_CONFIG.STATUS_MAPPING[status] || 'processing';
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

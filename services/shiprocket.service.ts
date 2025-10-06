/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Shiprocket Service - Clean Implementation
 * This is a thin wrapper around the new modular Shiprocket SDK
 * Maintains backward compatibility while providing clean architecture
 */

import { getShiprocketSDK } from '@/lib/shiprocket';
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
  private sdk = getShiprocketSDK();

  private constructor() {}

  public static getInstance(): ShiprocketService {
    if (!ShiprocketService.instance) {
      ShiprocketService.instance = new ShiprocketService();
    }
    return ShiprocketService.instance;
  }

  /**
   * Create order in Shiprocket
   */
  async createOrder(orderData: ShiprocketOrderRequest): Promise<ShiprocketOrderResponse> {
    const response = await this.sdk.orders.createOrder(orderData);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to create order');
    }
    return response.data!;
  }

  /**
   * Track order by AWB code
   */
  async trackOrderByAWB(awbCode: string): Promise<ShiprocketTrackingResponse> {
    const response = await this.sdk.tracking.trackByAWB(awbCode);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to track order');
    }
    return response.data!;
  }

  /**
   * Track order by Shiprocket order ID
   */
  async trackOrderById(orderId: number): Promise<ShiprocketTrackingResponse> {
    const response = await this.sdk.tracking.trackByOrderId(orderId);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to track order');
    }
    return response.data!;
  }

  /**
   * Cancel Shiprocket orders
   */
  async cancelOrder(orderIds: number[]): Promise<any> {
    const response = await this.sdk.orders.cancelOrders(orderIds);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to cancel orders');
    }
    return response.data;
  }

  /**
   * Add pickup location to Shiprocket
   */
  async addPickupLocation(locationData: ShiprocketPickupLocationRequest): Promise<any> {
    const response = await this.sdk.pickups.addPickupLocation(locationData);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to add pickup location');
    }
    return response.data;
  }

  /**
   * Get all pickup locations
   */
  async getPickupLocations(): Promise<any> {
    const response = await this.sdk.pickups.getAllPickupLocations();
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to get pickup locations');
    }
    return response.data;
  }

  /**
   * Create pickup location for vendor
   */
  async createVendorPickupLocation(vendor: any): Promise<{ success: boolean; location_name?: string; error?: string }> {
    return this.sdk.pickups.createVendorPickupLocation(vendor);
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
    return this.sdk.orders.formatOrderForShiprocket(order, address, user, vendorData);
  }

  /**
   * Map Shiprocket status to your system status
   */
  mapStatusToSystem(shiprocketStatus: string): string {
    return this.sdk.orders.mapStatusToSystem(shiprocketStatus);
  }

  /**
   * Check if status change should trigger email notification
   */
  shouldNotifyUser(shiprocketStatus: string): boolean {
    return this.sdk.orders.shouldNotifyUser(shiprocketStatus);
  }

  /**
   * Get notification type for email
   */
  getNotificationType(shiprocketStatus: string): string | null {
    return this.sdk.orders.getNotificationType(shiprocketStatus);
  }

  /**
   * Check authentication status
   */
  isAuthenticated(): boolean {
    return this.sdk.isAuthenticated();
  }

  /**
   * Get token info for debugging
   */
  getTokenInfo() {
    return this.sdk.getTokenInfo();
  }
}

// Export types for backward compatibility
export type {
  ShiprocketOrderRequest,
  ShiprocketOrderResponse,
  ShiprocketTrackingResponse,
  ShiprocketPickupLocationRequest,
} from '@/lib/shiprocket/types';

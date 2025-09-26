/**
 * Shiprocket Order Handler
 * Handles Shiprocket order creation and management
 */

import { getShiprocketSDK } from "@/lib/shiprocket";
import { VendorService } from "@/services/vendor.service";
import { OrdersService } from "@/services/orders.service";
import User from "@/lib/models/user.model";
import Order from "@/lib/models/order.model";
import { connectToDB } from "@/lib/mongodb";

export interface ShiprocketOrderCreationOptions {
  orderId: string;
  skipVendorValidation?: boolean;
  customPickupLocation?: {
    name: string;
    email: string;
    phone: string;
    address: string;
    address_2?: string;
    city: string;
    state: string;
    country: string;
    pin_code: string;
  };
}

export interface ShiprocketOrderResult {
  success: boolean;
  error?: string;
  shiprocketData?: {
    order_id: number;
    shipment_id: number;
    awb_code?: string;
    courier_name?: string;
  };
}

/**
 * Handle Shiprocket order creation for an order
 */
export async function handleShiprocketOrderCreation(
  options: ShiprocketOrderCreationOptions
): Promise<ShiprocketOrderResult> {
  try {
    const { orderId, skipVendorValidation = false, customPickupLocation } = options;

    console.log(`[Shiprocket Handler] Processing order: ${orderId}`);

    await connectToDB();
    const sdk = getShiprocketSDK();

    // Get order details
    const order = await OrdersService.getOrderById(orderId);
    if (!order.success || !order.data) {
      return {
        success: false,
        error: "Order not found",
      };
    }

    const orderData = order.data as IOrder;

    // Get user details
    const user = await User.findById(orderData.userId);
    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // Get address details
    const address = user.addresses.find(
      (addr: any) => addr._id.toString() === orderData.addressId.toString()
    );
    if (!address) {
      return {
        success: false,
        error: "Address not found",
      };
    }

    // Handle pickup location - custom takes precedence over vendor location
    let vendorData = null;
    let finalPickupLocationName = null;
    
    if (customPickupLocation) {
      // Use custom pickup location provided by admin/vendor
      console.log('[Shiprocket Handler] Using custom pickup location:', customPickupLocation.name);
      
      // Create pickup location name for custom location with 36 character limit
      const sanitizedName = customPickupLocation.name.replace(/[^a-zA-Z0-9_]/g, '_');
      const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
      let customLocationName = `Custom_${sanitizedName}_${timestamp}`;
      
      // Enforce 36 character limit (Shiprocket requirement)
      if (customLocationName.length > 36) {
        const prefixLength = 7 + timestamp.length + 1; // "Custom_" + timestamp + "_"
        const maxNameLength = 36 - prefixLength;
        const truncatedName = sanitizedName.slice(0, maxNameLength);
        customLocationName = `Custom_${truncatedName}_${timestamp}`;
        
        // Final safety check
        if (customLocationName.length > 36) {
          customLocationName = customLocationName.slice(0, 36);
        }
      }
      
      // Add pickup location to Shiprocket
      const pickupResult = await sdk.pickups.addPickupLocation({
        pickup_location: customLocationName,
        name: customPickupLocation.name,
        email: customPickupLocation.email,
        phone: customPickupLocation.phone,
        address: customPickupLocation.address,
        address_2: customPickupLocation.address_2 || '',
        city: customPickupLocation.city,
        state: customPickupLocation.state,
        country: customPickupLocation.country,
        pin_code: customPickupLocation.pin_code,
      });
      
      if (pickupResult.success) {
        finalPickupLocationName = customLocationName;
        console.log('[Shiprocket Handler] Custom pickup location created successfully');
      } else {
        console.error('[Shiprocket Handler] Failed to create custom pickup location:', pickupResult.error);
        // Fall back to vendor or default pickup location
      }
    }
    
    // Get vendor details for pickup location (if not using custom or custom failed)
    if (
      orderData.items &&
      orderData.items.length > 0 &&
      !skipVendorValidation &&
      !finalPickupLocationName
    ) {
      const vendorId = orderData.items[0].vendorId; // Use first item's vendor
      if (vendorId) {
        const vendorResponse = await VendorService.getVendorById(vendorId);
        if (vendorResponse.success && vendorResponse.data) {
          vendorData = vendorResponse.data;

          // Ensure vendor has pickup location in Shiprocket
          if (!vendorData.shiprocket_pickup_location_added) {
            console.log(
              "[Shiprocket Handler] Creating pickup location for vendor:",
              vendorData.name
            );
            const pickupResult = await sdk.pickups.createVendorPickupLocation(
              vendorData
            );

            if (pickupResult.success && pickupResult.location_name) {
              // Update vendor with pickup location info
              await VendorService.updateVendor(vendorData._id, {
                shiprocket_pickup_location: pickupResult.location_name,
                shiprocket_pickup_location_added: true,
              });
              vendorData.shiprocket_pickup_location =
                pickupResult.location_name;
              vendorData.shiprocket_pickup_location_added = true;
              finalPickupLocationName = pickupResult.location_name;
            } else {
              console.error(
                "[Shiprocket Handler] Failed to create pickup location:",
                pickupResult.error
              );
              // Continue with default pickup location
            }
          } else {
            finalPickupLocationName = vendorData.shiprocket_pickup_location;
          }
        }
      }
    }

    // Create vendor data with final pickup location for formatting
    const effectiveVendorData = vendorData ? {
      ...vendorData,
      shiprocket_pickup_location: finalPickupLocationName || vendorData.shiprocket_pickup_location
    } : null;
    
    // Format order for Shiprocket
    const shiprocketOrderData = sdk.orders.formatOrderForShiprocket(
      orderData,
      address,
      user,
      effectiveVendorData
    );

    console.log(
      "[Shiprocket Handler] Creating Shiprocket order with pickup location:",
      shiprocketOrderData.pickup_location
    );

    // Create order in Shiprocket
    const shiprocketResponse = await sdk.orders.createOrder(
      shiprocketOrderData
    );

    if (!shiprocketResponse.success) {
      return {
        success: false,
        error:
          shiprocketResponse.error?.message ||
          "Failed to create Shiprocket order",
      };
    }

    const responseData = shiprocketResponse.data!;

    // Update order with Shiprocket details
    await Order.findByIdAndUpdate(orderId, {
      "shipping.shiprocket_order_id": responseData.order_id,
      "shipping.shiprocket_shipment_id": responseData.shipment_id,
      "shipping.awb_code": responseData.awb_code,
      "shipping.courier_name": responseData.courier_name,
      "shipping.shipping_status": responseData.status,
      "shipping.last_update": new Date(),
    });

    console.log(
      `[Shiprocket Handler] Order created successfully for ${orderData.orderId}:`,
      responseData
    );

    return {
      success: true,
      shiprocketData: {
        order_id: responseData.order_id,
        shipment_id: responseData.shipment_id,
        awb_code: responseData.awb_code || undefined,
        courier_name: responseData.courier_name || undefined,
      },
    };
  } catch (error) {
    console.error(
      "[Shiprocket Handler] Error creating Shiprocket order:",
      error
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Update order shipping information from Shiprocket webhook
 */
export async function updateOrderFromWebhook(
  webhookData: any
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("[Shiprocket Handler] Processing webhook data:", webhookData);

    await connectToDB();
    const sdk = getShiprocketSDK();

    const {
      order_id,
      shipment_id,
      current_status,
      awb_code,
      courier_name,
      activities,
    } = webhookData;

    // Find order by Shiprocket order ID
    const order = await Order.findOne({
      "shipping.shiprocket_order_id": order_id,
    });

    if (!order) {
      console.log(
        `[Shiprocket Handler] Order not found for Shiprocket order ID: ${order_id}`
      );
      return { success: false, error: "Order not found" };
    }

    // Map Shiprocket status to system status
    const systemStatus = sdk.orders.mapStatusToSystem(current_status);

    // Update order with new information
    const updateData: any = {
      "shipping.shipping_status": current_status,
      "shipping.last_update": new Date(),
      status: systemStatus,
    };

    if (awb_code) updateData["shipping.awb_code"] = awb_code;
    if (courier_name) updateData["shipping.courier_name"] = courier_name;
    if (activities) updateData["shipping.shipping_history"] = activities;

    // Update delivery date if delivered
    if (
      current_status.toUpperCase() === "DELIVERED" &&
      webhookData.delivered_date
    ) {
      updateData["shipping.delivered_date"] = new Date(
        webhookData.delivered_date
      );
    }

    // Update pickup date if picked up
    if (webhookData.pickup_date) {
      updateData["shipping.pickup_date"] = new Date(webhookData.pickup_date);
    }

    await Order.findByIdAndUpdate(order._id, updateData);

    console.log(
      `[Shiprocket Handler] Updated order ${order.orderId} with status: ${current_status} -> ${systemStatus}`
    );

    return { success: true };
  } catch (error) {
    console.error(
      "[Shiprocket Handler] Error updating order from webhook:",
      error
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

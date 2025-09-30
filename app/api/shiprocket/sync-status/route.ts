/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse, NextRequest } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import Order from "@/lib/models/order.model";
import User from "@/lib/models/user.model";
import { getShiprocketSDK } from "@/lib/shiprocket";
import { sendShippingNotificationEmail } from "@/lib/workflows/emails/shipping/shippingEmails";

// Simple in-memory rate limiter
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_MINUTE = 30; // Conservative limit for Shiprocket API
const INTER_REQUEST_DELAY = 100; // 100ms delay between individual requests
const BATCH_DELAY = 2000; // 2 second delay between batches

/**
 * POST endpoint for manual status sync (can be called by cron job services like Vercel Cron)
 * This endpoint syncs order statuses for all active shipments
 */
export async function POST(request: NextRequest) {
  try {
    await connectToDB();

    const authorization = request.headers.get('authorization');

    // Simple API key validation for cron job security
    // You should set CRON_SECRET in your environment variables
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authorization !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("Starting Shiprocket status sync...");

    // Find all orders with active shipments that haven't been delivered yet
    // Include orders without AWB codes to enable early tracking and notifications
    const activeOrders = await Order.find({
      $or: [
        { "shipping.shiprocket_order_id": { $exists: true } },
        { "shipping.shiprocket_shipment_id": { $exists: true } }
      ],
      status: { $in: ["ready to ship", "shipped", "out for delivery"] },
    }).sort({ "shipping.last_update": 1 }); // Start with oldest updates first

    console.log(`Found ${activeOrders.length} active shipments to sync`);

    const sdk = getShiprocketSDK();
    const results = {
      total: activeOrders.length,
      updated: 0,
      errors: 0,
      notifications_sent: 0,
    };

    // Process orders in batches to avoid overwhelming the API
    const batchSize = 8; // Reduced batch size for better rate limiting
    for (let i = 0; i < activeOrders.length; i += batchSize) {
      const batch = activeOrders.slice(i, i + batchSize);

      // Process orders sequentially within batch to control rate
      for (const order of batch) {
        try {
          // Check rate limit before each request
          await enforceRateLimit();
          await syncOrderStatus(order, sdk, results);
          // Small delay between individual requests
          await new Promise((resolve) => setTimeout(resolve, INTER_REQUEST_DELAY));
        } catch (error) {
          console.error(`Error syncing order ${order.orderId}:`, error);
          results.errors++;
        }
      }

      // Add delay between batches
      if (i + batchSize < activeOrders.length) {
        await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY));
      }
    }

    console.log("Shiprocket status sync completed:", results);

    return NextResponse.json({
      success: true,
      message: "Status sync completed",
      results,
    });
  } catch (error) {
    console.error("Shiprocket sync error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Sync failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check sync status and get information
 */
export async function GET(request: NextRequest) {
  try {
    await connectToDB();

    // Count active shipments
    const activeShipments = await Order.countDocuments({
      $or: [
        { "shipping.shiprocket_order_id": { $exists: true } },
        { "shipping.shiprocket_shipment_id": { $exists: true } }
      ],
      status: { $in: ["ready to ship", "shipped", "out for delivery"] },
    });

    // Get last sync information
    const lastSyncedOrder = await Order.findOne({
      "shipping.last_update": { $exists: true },
    }).sort({ "shipping.last_update": -1 });

    return NextResponse.json({
      success: true,
      active_shipments: activeShipments,
      last_sync: lastSyncedOrder?.shipping?.last_update || null,
      sync_endpoint: "/api/shiprocket/sync-status",
      webhook_endpoint: "/api/shiprocket/webhook",
    });
  } catch (error) {
    console.error("Sync status check error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Rate limiting helper function
async function enforceRateLimit(): Promise<void> {
  const now = Date.now();
  const key = 'shiprocket_api';
  
  let entry = rateLimitMap.get(key);
  
  // Clean up expired entries
  if (!entry || now > entry.resetTime) {
    entry = { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
    rateLimitMap.set(key, entry);
  }
  
  // Check if we're at the limit
  if (entry.count >= MAX_REQUESTS_PER_MINUTE) {
    const waitTime = entry.resetTime - now;
    console.log(`Rate limit reached, waiting ${waitTime}ms...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
    
    // Reset after waiting
    entry = { count: 0, resetTime: now + waitTime + RATE_LIMIT_WINDOW };
    rateLimitMap.set(key, entry);
  }
  
  entry.count++;
}

// Helper function to sync individual order status
async function syncOrderStatus(
  order: any,
  sdk: any,
  results: any
): Promise<void> {
  try {
    // Skip if updated recently (within last 30 minutes)
    const now = new Date();
    const lastUpdate = order.shipping?.last_update;
    if (lastUpdate && now.getTime() - lastUpdate.getTime() < 30 * 60 * 1000) {
      return;
    }

    let trackingData;
    let trackingResponse;
    let trackingMethod = 'unknown';

    // Try multiple tracking methods in order of preference
    // 1. Try AWB code first (most reliable when available)
    if (order.shipping?.awb_code) {
      try {
        console.log(`[Sync] Trying AWB tracking for ${order.orderId}: ${order.shipping.awb_code}`);
        trackingResponse = await sdk.tracking.trackByAWB(order.shipping.awb_code);
        if (trackingResponse.success && trackingResponse.data?.tracking_data?.shipment_track?.[0]) {
          trackingData = trackingResponse.data;
          trackingMethod = 'awb';
        }
      } catch (error) {
        console.log(`[Sync] AWB tracking failed for ${order.orderId}:`, error instanceof Error ? error.message : 'Unknown error');
      }
    }

    // 2. Try Shiprocket order ID if AWB failed or not available
    if (!trackingData && order.shipping?.shiprocket_order_id) {
      try {
        console.log(`[Sync] Trying order ID tracking for ${order.orderId}: ${order.shipping.shiprocket_order_id}`);
        trackingResponse = await sdk.tracking.trackByOrderId(order.shipping.shiprocket_order_id);
        if (trackingResponse.success && trackingResponse.data?.tracking_data?.shipment_track?.[0]) {
          trackingData = trackingResponse.data;
          trackingMethod = 'order_id';
        }
      } catch (error) {
        console.log(`[Sync] Order ID tracking failed for ${order.orderId}:`, error instanceof Error ? error.message : 'Unknown error');
      }
    }

    // 3. Try shipment ID as last resort (convert to order ID first)
    if (!trackingData && order.shipping?.shiprocket_shipment_id) {
      try {
        console.log(`[Sync] Trying shipment ID tracking for ${order.orderId}: ${order.shipping.shiprocket_shipment_id}`);
        
        // Find the shiprocket_order_id associated with this shipment_id
        const orderWithShipment = await Order.findOne({
          "shipping.shiprocket_shipment_id": order.shipping.shiprocket_shipment_id,
          "shipping.shiprocket_order_id": { $exists: true }
        });
        
        if (orderWithShipment?.shipping?.shiprocket_order_id) {
          trackingResponse = await sdk.tracking.trackByOrderId(orderWithShipment.shipping.shiprocket_order_id);
          if (trackingResponse.success && trackingResponse.data?.tracking_data?.shipment_track?.[0]) {
            trackingData = trackingResponse.data;
            trackingMethod = 'shipment_id';
          }
        }
      } catch (error) {
        console.log(`[Sync] Shipment ID tracking failed for ${order.orderId}:`, error instanceof Error ? error.message : 'Unknown error');
      }
    }

    if (!trackingData?.tracking_data?.shipment_track?.[0]) {
      console.log(`[Sync] No tracking data found for order ${order.orderId} using any method`);
      return;
    }

    console.log(`[Sync] Successfully tracked ${order.orderId} using ${trackingMethod}`);

    // Extract AWB code from tracking data if not already stored
    const shipmentInfo = trackingData.tracking_data.shipment_track[0];
    if (!order.shipping?.awb_code && shipmentInfo.awb_code) {
      console.log(`[Sync] Found AWB code for ${order.orderId}: ${shipmentInfo.awb_code}`);
    }

    const currentStatus = shipmentInfo.current_status;
    const previousStatus = order.shipping?.shipping_status;

    // Check if status has changed
    if (currentStatus === previousStatus) {
      // Update last_update timestamp and AWB code if found
      const updateData: any = { "shipping.last_update": now };
      if (!order.shipping?.awb_code && shipmentInfo.awb_code) {
        updateData["shipping.awb_code"] = shipmentInfo.awb_code;
      }
      await Order.findByIdAndUpdate(order._id, updateData);
      return;
    }

    // Map to system status
    const systemStatus = sdk.orders.mapStatusToSystem(currentStatus);

    // Prepare update data
    const updateData: any = {
      status: systemStatus,
      "shipping.shipping_status": currentStatus,
      "shipping.last_update": now,
    };

    // Store AWB code if found and not already stored
    if (!order.shipping?.awb_code && shipmentInfo.awb_code) {
      updateData["shipping.awb_code"] = shipmentInfo.awb_code;
    }

    // Store courier name if available and not already stored
    if (!order.shipping?.courier_name && shipmentInfo.courier_name) {
      updateData["shipping.courier_name"] = shipmentInfo.courier_name;
    }

    // Update optional fields if available
    if (shipmentInfo.pickup_date && !order.shipping.pickup_date) {
      updateData["shipping.pickup_date"] = new Date(shipmentInfo.pickup_date);
    }
    if (shipmentInfo.delivered_date) {
      updateData["shipping.delivered_date"] = new Date(
        shipmentInfo.delivered_date
      );
    }
    if (shipmentInfo.edd && !order.shipping.eta) {
      updateData["shipping.eta"] = new Date(shipmentInfo.edd);
    }

    // Update tracking history if available
    if (trackingData.tracking_data.shipment_track_activities) {
      const trackingHistory =
        trackingData.tracking_data.shipment_track_activities.map(
          (activity: any) => ({
            status: activity.status,
            activity: activity.activity,
            location: activity.location,
            date: new Date(activity.date),
          })
        );

      updateData["shipping.shipping_history"] = trackingHistory;
    }

    // Update the order
    await Order.findByIdAndUpdate(order._id, updateData);
    results.updated++;

    // Send notification if status change warrants it
    if (sdk.orders.shouldNotifyUser(currentStatus)) {
      try {
        await sendStatusUpdateNotification(
          order,
          currentStatus,
          systemStatus,
          shipmentInfo,
          trackingData,
          sdk
        );
        results.notifications_sent++;
      } catch (emailError) {
        console.error(
          `Failed to send notification for order ${order.orderId}:`,
          emailError
        );
      }
    }

    console.log(
      `Order ${order.orderId} synced: ${previousStatus} -> ${currentStatus} (${systemStatus})`
    );
  } catch (error) {
    console.error(`Error syncing order ${order.orderId}:`, error);
    throw error;
  }
}

// Helper function to send status update notifications
async function sendStatusUpdateNotification(
  order: any,
  currentStatus: string,
  systemStatus: string,
  shipmentInfo: any,
  trackingData: any,
  sdk: any
): Promise<void> {
  try {
    // Get user details
    const user = await User.findById(order.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Get address details
    const address = user.addresses.find(
      (addr: any) => addr._id.toString() === order.addressId.toString()
    );

    const notificationType = sdk.orders.getNotificationType(currentStatus);

    if (!notificationType) {
      return;
    }

    // Prepare email data with fallback tracking options
    const awbCode = order.shipping?.awb_code || shipmentInfo.awb_code;
    const courierName = order.shipping?.courier_name || shipmentInfo.courier_name || "Courier Partner";
    
    // Generate tracking URL with fallbacks
    let trackingUrl = '';
    let trackingMessage = '';
    
    if (awbCode) {
      trackingUrl = `https://shiprocket.co/tracking/${awbCode}`;
      trackingMessage = `Track your order using AWB: ${awbCode}`;
    } else if (order.shipping?.shiprocket_order_id) {
      // Fallback to internal tracking page or Shiprocket order tracking
      trackingUrl = `${process.env.NEXTAUTH_URL || 'https://yoursite.com'}/track-order?orderId=${order.orderId}`;
      trackingMessage = `Track your order using Order ID: ${order.orderId}`;
    } else {
      trackingUrl = `${process.env.NEXTAUTH_URL || 'https://yoursite.com'}/orders/${order.orderId}`;
      trackingMessage = `View your order details: ${order.orderId}`;
    }
    
    // Prepare tracking history if available
    const trackingHistory = trackingData.tracking_data.shipment_track_activities
      ? trackingData.tracking_data.shipment_track_activities.map((activity: any) => ({
          status: activity.status,
          activity: activity.activity,
          location: activity.location,
          date: new Date(activity.date),
        }))
      : [];

    const emailData = {
      orderId: order.orderId,
      userName: user.name,
      userEmail: user.email,
      trackingNumber: awbCode || 'Processing',
      courierName: courierName,
      currentStatus: currentStatus,
      systemStatus: systemStatus,
      estimatedDelivery: shipmentInfo.edd
        ? new Date(shipmentInfo.edd).toDateString()
        : null,
      trackingUrl: trackingUrl,
      trackingMessage: trackingMessage, // Additional field for email template
      orderDate: order.createdAt,
      items: order.items,
      total: order.total,
      address: address || {
        name: "",
        contact: "",
        address_line_1: "",
        address_line_2: "",
        locality: "",
        state: "",
        pincode: "",
        type: "",
      },
      trackingHistory: trackingHistory,
    };

    await sendShippingNotificationEmail(notificationType, emailData);
    console.log(
      `Notification sent to ${user.email} for order ${order.orderId}: ${notificationType}`
    );
  } catch (error) {
    console.error("Error sending status update notification:", error);
    throw error;
  }
}

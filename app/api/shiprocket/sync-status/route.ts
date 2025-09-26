/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse, NextRequest } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import Order from "@/lib/models/order.model";
import User from "@/lib/models/user.model";
import { getShiprocketSDK } from "@/lib/shiprocket";
import { sendShippingNotificationEmail } from "@/lib/workflows/emails/shipping/shippingEmails";

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
    const activeOrders = await Order.find({
      "shipping.shiprocket_order_id": { $exists: true },
      status: { $in: ["ready to ship", "shipped", "out for delivery"] },
      "shipping.awb_code": { $exists: true, $ne: null },
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
    const batchSize = 10;
    for (let i = 0; i < activeOrders.length; i += batchSize) {
      const batch = activeOrders.slice(i, i + batchSize);

      await Promise.allSettled(
        batch.map(async (order) => {
          try {
            await syncOrderStatus(order, sdk, results);
          } catch (error) {
            console.error(`Error syncing order ${order.orderId}:`, error);
            results.errors++;
          }
        })
      );

      // Add small delay between batches to be respectful to the API
      if (i + batchSize < activeOrders.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
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
      "shipping.shiprocket_order_id": { $exists: true },
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

    // Try to get tracking data by AWB first, then by order ID
    let trackingResponse;
    try {
      trackingResponse = await sdk.tracking.trackByAWB(
        order.shipping.awb_code
      );
      trackingData = trackingResponse.success ? trackingResponse.data : null;
    } catch {
      console.log(
        `AWB tracking failed for ${order.orderId}, trying order ID...`
      );
      trackingResponse = await sdk.tracking.trackByOrderId(
        order.shipping.shiprocket_order_id
      );
      trackingData = trackingResponse.success ? trackingResponse.data : null;
    }

    if (!trackingData?.tracking_data?.shipment_track?.[0]) {
      console.log(`No tracking data found for order ${order.orderId}`);
      return;
    }

    const shipmentInfo = trackingData.tracking_data.shipment_track[0];
    const currentStatus = shipmentInfo.current_status;
    const previousStatus = order.shipping?.shipping_status;

    // Check if status has changed
    if (currentStatus === previousStatus) {
      // Update last_update timestamp even if status hasn't changed
      await Order.findByIdAndUpdate(order._id, {
        "shipping.last_update": now,
      });
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

    // Prepare email data
    const emailData = {
      orderId: order.orderId,
      userName: user.name,
      userEmail: user.email,
      trackingNumber: order.shipping.awb_code,
      courierName: order.shipping.courier_name || "Courier Partner",
      currentStatus: currentStatus,
      systemStatus: systemStatus,
      estimatedDelivery: shipmentInfo.edd
        ? new Date(shipmentInfo.edd).toDateString()
        : null,
      trackingUrl: `https://shiprocket.co/tracking/${order.shipping.awb_code}`,
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
      trackingHistory: [],
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

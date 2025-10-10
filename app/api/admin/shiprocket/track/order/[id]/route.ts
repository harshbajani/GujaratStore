/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getShiprocketSDK } from "@/lib/shiprocket";
import { connectToDB } from "@/lib/mongodb";
import Order from "@/lib/models/order.model";
import User from "@/lib/models/user.model";
import { sendShippingNotificationEmail } from "@/lib/workflows/emails/shipping/shippingEmails";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "order"; // 'order' or 'shipment'
    const sendEmail = searchParams.get("sendEmail") === "true";

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID is required" },
        { status: 400 }
      );
    }

    const sdk = getShiprocketSDK();

    // Get authentication token
    const token = await sdk.auth.getToken();
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Authentication failed" },
        { status: 401 }
      );
    }

    let trackingResponse;
    let orderId: number;

    if (type === "shipment") {
      // Track by Shiprocket shipment ID - need to convert to order ID first
      try {
        // For shipment ID, we need to find the order first
        await connectToDB();
        const order = await Order.findOne({
          "shipping.shiprocket_shipment_id": parseInt(id),
        });

        if (!order || !order.shipping?.shiprocket_order_id) {
          return NextResponse.json(
            { success: false, error: "Order not found for shipment ID" },
            { status: 404 }
          );
        }

        orderId = order.shipping.shiprocket_order_id;
        trackingResponse = await sdk.tracking.trackByOrderId(orderId);
      } catch {
        return NextResponse.json(
          { success: false, error: "Invalid shipment ID" },
          { status: 400 }
        );
      }
    } else {
      // Track by Shiprocket order ID
      try {
        orderId = parseInt(id);
        trackingResponse = await sdk.tracking.trackByOrderId(orderId);
      } catch {
        return NextResponse.json(
          { success: false, error: "Invalid order ID" },
          { status: 400 }
        );
      }
    }

    if (trackingResponse.success && trackingResponse.data) {
      const trackingData = trackingResponse.data;

      // Extract relevant tracking information
      const shipmentTrack = trackingData.tracking_data?.shipment_track?.[0];
      const trackingActivities =
        trackingData.tracking_data?.shipment_track_activities || [];

      if (!shipmentTrack) {
        return NextResponse.json(
          { success: false, error: "No tracking data found" },
          { status: 404 }
        );
      }

      // Format the response
      const shipmentTrackData = shipmentTrack as any;

      const formattedTracking = {
        awb_code: shipmentTrackData.awb_code,
        courier_name:
          shipmentTrackData.courier_name ||
          shipmentTrackData.courier_company_name,
        shipping_status: shipmentTrackData.current_status,
        pickup_date: shipmentTrackData.pickup_date,
        delivered_date: shipmentTrackData.delivered_date,
        eta: shipmentTrackData.edd,
        last_update: new Date().toISOString(),
        shipping_history: trackingActivities
          .map((activity: any) => ({
            status: activity.status,
            activity: activity.activity,
            location: activity.location,
            date: activity.date,
            time: activity.time || null,
          }))
          .reverse(), // Most recent first
        // Additional details
        order_id: shipmentTrackData.order_id,
        shipment_id: shipmentTrackData.shipment_id,
      };

      // If sendEmail is true, send tracking notification email
      if (sendEmail) {
        try {
          await connectToDB();

          // Find the order in our database
          const order = await Order.findOne({
            "shipping.shiprocket_order_id": orderId,
          });

          if (order) {
            // Get user details
            const user = await User.findById(order.userId);
            if (user) {
              // Get address details
              const address = user.addresses.find(
                (addr: any) =>
                  addr._id.toString() === order.addressId.toString()
              );

              // Determine notification type based on status
              let notificationType = null;
              const status = shipmentTrackData.current_status.toUpperCase();

              if (["SHIPPED", "IN_TRANSIT", "DISPATCHED"].includes(status)) {
                notificationType = "shipped";
              } else if (["OUT_FOR_DELIVERY"].includes(status)) {
                notificationType = "out_for_delivery";
              } else if (["DELIVERED"].includes(status)) {
                notificationType = "delivered";
              }

              if (notificationType) {
                // Prepare email data
                const emailData = {
                  orderId: order.orderId,
                  userName: user.name,
                  userEmail: user.email,
                  trackingNumber: formattedTracking.awb_code || "",
                  courierName:
                    formattedTracking.courier_name || "Courier Partner",
                  currentStatus: shipmentTrackData.current_status,
                  systemStatus: order.status,
                  estimatedDelivery: formattedTracking.eta
                    ? new Date(formattedTracking.eta).toDateString()
                    : null,
                  trackingUrl: formattedTracking.awb_code
                    ? `https://shiprocket.co/tracking/${formattedTracking.awb_code}`
                    : "",
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
                  trackingHistory: formattedTracking.shipping_history,
                };

                await sendShippingNotificationEmail(
                  notificationType,
                  emailData
                );
                console.log(
                  `Tracking email sent to ${user.email} for order ${order.orderId}: ${notificationType}`
                );
              }
            }
          }
        } catch (emailError) {
          console.error("Error sending tracking email:", emailError);
          // Don't fail the whole request if email fails
        }
      }

      return NextResponse.json({
        success: true,
        tracking: formattedTracking,
        emailSent: sendEmail,
      });
    } else {
      console.error(
        "[Shiprocket Track Order] API Error:",
        trackingResponse.error
      );
      return NextResponse.json(
        {
          success: false,
          error:
            trackingResponse.error?.message ||
            "Failed to fetch tracking information",
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("[Shiprocket Track Order] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "An error occurred",
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: "Method not allowed. Use GET to fetch tracking information.",
    },
    { status: 405 }
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import Order from "@/lib/models/order.model";
import User from "@/lib/models/user.model";
import { sendShippingNotificationEmail } from "@/lib/workflows/emails/shipping/shippingEmails";

const BACKEND_URL = process.env.SHIPROCKET_BACKEND_URL || "http://localhost:8000";

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

    // Get tracking data from backend
    const queryParams = new URLSearchParams({ type, sendEmail: sendEmail.toString() });
    const trackingResponse = await fetch(`${BACKEND_URL}/shiprocket/track/order/${id}?${queryParams.toString()}`);
    
    if (!trackingResponse.ok) {
      const errorData = await trackingResponse.json();
      return NextResponse.json(errorData, { status: trackingResponse.status });
    }

    const { tracking: formattedTracking } = await trackingResponse.json();
    let orderId: number;

    if (type === "shipment") {
      await connectToDB();
      const order = await Order.findOne({
        "shipping.shiprocket_shipment_id": parseInt(id),
      });
      if (!order?.shipping?.shiprocket_order_id) {
        return NextResponse.json(
          { success: false, error: "Order not found for shipment ID" },
          { status: 404 }
        );
      }
      orderId = order.shipping.shiprocket_order_id;
    } else {
      orderId = parseInt(id);
    }

    // If sendEmail is true and we have tracking data, send notification
    if (sendEmail && formattedTracking) {
      try {
        await connectToDB();
        const order = await Order.findOne({
          "shipping.shiprocket_order_id": orderId,
        });

        if (order) {
          const user = await User.findById(order.userId);
          if (user) {
            const address = user.addresses.find(
              (addr: any) => addr._id.toString() === order.addressId.toString()
            );

            // Determine notification type based on status
            let notificationType = null;
            const status = formattedTracking.shipping_status?.toUpperCase();

            if (["SHIPPED", "IN_TRANSIT", "DISPATCHED"].includes(status)) {
              notificationType = "shipped";
            } else if (["OUT_FOR_DELIVERY"].includes(status)) {
              notificationType = "out_for_delivery";
            } else if (["DELIVERED"].includes(status)) {
              notificationType = "delivered";
            }

            if (notificationType) {
              const emailData = {
                orderId: order.orderId,
                userName: user.name,
                userEmail: user.email,
                trackingNumber: formattedTracking.awb_code || "",
                courierName: formattedTracking.courier_name || "Courier Partner",
                currentStatus: formattedTracking.shipping_status,
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
                  name: "", contact: "", address_line_1: "",
                  address_line_2: "", locality: "", state: "", pincode: "", type: "",
                },
                trackingHistory: formattedTracking.shipping_history,
              };

              await sendShippingNotificationEmail(notificationType, emailData);
              console.log(`Tracking email sent to ${user.email} for order ${order.orderId}: ${notificationType}`);
            }
          }
        }
      } catch (emailError) {
        console.error("Error sending tracking email:", emailError);
      }
    }

    return NextResponse.json({
      success: true,
      tracking: formattedTracking,
      emailSent: sendEmail,
    });
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

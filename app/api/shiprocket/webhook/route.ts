/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse, NextRequest } from "next/server";
import { updateOrderFromWebhook } from "@/lib/handlers/shiprocket-order.handler";

const BACKEND_URL = process.env.SHIPROCKET_BACKEND_URL || "http://localhost:8000";

// Shiprocket webhook payload interface
interface ShiprocketWebhookPayload {
  order_id: number;
  shipment_id: number;
  awb: string;
  courier_name: string;
  current_status: string;
  delivered_date?: string;
  pickup_date?: string;
  edd?: string;
  scans: Array<{
    activity: string;
    date: string;
    location: string;
    status: string;
  }>;
  etd?: string;
  delivered_to?: string;
}

export async function POST(request: NextRequest) {
  try {
    const payload: ShiprocketWebhookPayload = await request.json();
    console.log("[Shiprocket Webhook] Received:", payload);

    // Convert payload to standard format for handler
    const webhookData = {
      order_id: payload.order_id,
      shipment_id: payload.shipment_id,
      current_status: payload.current_status,
      awb_code: payload.awb,
      courier_name: payload.courier_name,
      delivered_date: payload.delivered_date,
      pickup_date: payload.pickup_date,
      activities: payload.scans?.map(scan => ({
        date: scan.date,
        status: scan.status,
        activity: scan.activity,
        location: scan.location,
      })),
    };

    // Process webhook in our database
    const result = await updateOrderFromWebhook(webhookData);

    // Also notify the backend (optional - for consistency)
    try {
      await fetch(`${BACKEND_URL}/shiprocket/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (backendError) {
      console.warn('[Webhook] Backend notification failed:', backendError);
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error || 'Failed to process webhook' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Webhook processed successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Shiprocket Webhook] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Webhook processing failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Handle GET requests (for webhook verification if needed)
export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      success: true,
      message: "Shiprocket webhook endpoint is active",
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}

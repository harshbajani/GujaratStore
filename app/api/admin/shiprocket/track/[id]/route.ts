import { NextResponse } from "next/server";
import { getShiprocketSDK } from "@/lib/shiprocket";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "awb"; // 'awb' or 'order'

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Tracking ID is required" },
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

    if (type === "awb") {
      // Track by AWB code
      trackingResponse = await sdk.tracking.trackByAWB(id);
    } else {
      // Track by Shiprocket order ID
      trackingResponse = await sdk.tracking.trackByOrderId(parseInt(id));
    }

    if (trackingResponse.success && trackingResponse.data) {
      const trackingData = trackingResponse.data;
      
      // Extract relevant tracking information
      const shipmentTrack = trackingData.tracking_data?.shipment_track?.[0];
      const trackingActivities = trackingData.tracking_data?.shipment_track_activities || [];

      if (!shipmentTrack) {
        return NextResponse.json(
          { success: false, error: "No tracking data found" },
          { status: 404 }
        );
      }

      // Format the response
      const shipmentTrackData = shipmentTrack as any;
      const trackingDataResponse = trackingData as any;
      
      const formattedTracking = {
        awb_code: shipmentTrackData.awb_code,
        courier_name: shipmentTrackData.courier_name || shipmentTrackData.courier_company_name,
        shipping_status: shipmentTrackData.current_status,
        pickup_date: shipmentTrackData.pickup_date,
        delivered_date: shipmentTrackData.delivered_date,
        eta: shipmentTrackData.edd,
        last_update: new Date().toISOString(),
        shipping_history: trackingActivities.map((activity: any) => ({
          status: activity.status,
          activity: activity.activity,
          location: activity.location,
          date: activity.date,
          time: activity.time || null
        })).reverse(), // Most recent first
        // Additional details
        order_id: shipmentTrackData.order_id,
        shipment_id: shipmentTrackData.shipment_id,
        origin: shipmentTrackData.origin,
        destination: shipmentTrackData.destination,
        consignee_name: shipmentTrackData.consignee_name,
        pickup_location: shipmentTrackData.pickup_location,
        pickup_scheduled_date: shipmentTrackData.pickup_scheduled_date,
        pickup_token: shipmentTrackData.pickup_token_number,
        rto_delivered_date: shipmentTrackData.rto_delivered_date,
        expected_delivery_date: shipmentTrackData.edd,
        pod_date: shipmentTrackData.pod_date,
        pod_details: trackingDataResponse.tracking_data?.pod_details,
      };

      return NextResponse.json({
        success: true,
        tracking: formattedTracking,
        raw_data: trackingData // Include raw data for debugging
      });
    } else {
      console.error("[Shiprocket Track] API Error:", trackingResponse.error);
      return NextResponse.json(
        { 
          success: false, 
          error: trackingResponse.error?.message || "Failed to fetch tracking information" 
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("[Shiprocket Track] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "An error occurred"
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json(
    { 
      success: false, 
      error: "Method not allowed. Use GET to fetch tracking information." 
    },
    { status: 405 }
  );
}

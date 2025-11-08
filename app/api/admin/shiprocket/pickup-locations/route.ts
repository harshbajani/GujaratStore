/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { VendorService } from "@/services/vendor.service";

const BACKEND_URL =
  process.env.SHIPROCKET_BACKEND_URL || "http://localhost:8000";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "list") {
      // Proxy to backend
      const response = await fetch(
        `${BACKEND_URL}/shiprocket/pickup-locations?action=list`
      );
      const data = await response.json();

      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(
      { success: false, message: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Get pickup locations error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "An error occurred",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const {
      action,
      vendorId,
      pickup_location,
      name,
      email,
      phone,
      address,
      address_2,
      city,
      state,
      country,
      pin_code,
    } = await request.json();

    if (action === "create") {
      if (!vendorId) {
        return NextResponse.json(
          { success: false, message: "Vendor ID is required" },
          { status: 400 }
        );
      }

      const result = await VendorService.createVendorPickupLocation(vendorId);

      if (result.success) {
        return NextResponse.json({
          success: true,
          message: result.message,
          data: result.data,
        });
      } else {
        return NextResponse.json(
          { success: false, message: result.message },
          { status: 400 }
        );
      }
    }

    if (action === "create-admin") {
      // Proxy to backend for admin pickup location creation
      const response = await fetch(
        `${BACKEND_URL}/shiprocket/pickup-locations`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "create-admin",
            pickup_location,
            name,
            email,
            phone,
            address,
            address_2,
            city,
            state,
            country,
            pin_code,
          }),
        }
      );

      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    }

    if (action === "sync-all") {
      const result = await VendorService.syncAllVendorPickupLocations();

      return NextResponse.json({
        success: result.success,
        message: result.message,
        data: result.data,
      });
    }

    return NextResponse.json(
      { success: false, message: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Pickup location management error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "An error occurred",
      },
      { status: 500 }
    );
  }
}

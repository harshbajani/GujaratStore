import { NextResponse } from "next/server";
import { VendorService } from "@/services/vendor.service";
import { getShiprocketSDK } from "@/lib/shiprocket";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "list") {
      // Get all pickup locations from Shiprocket
      const sdk = getShiprocketSDK();
      const response = await sdk.pickups.getAllPickupLocations();

      return NextResponse.json({
        success: response.success,
        data: response.data,
        error: response.error?.message,
      });
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
    const { action, vendorId, pickup_location, name, email, phone, address, address_2, city, state, country, pin_code } = await request.json();

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
      // Admin creating a custom pickup location
      if (!pickup_location || !name || !email || !phone || !address || !city || !state || !country || !pin_code) {
        return NextResponse.json(
          { 
            success: false, 
            message: "Missing required fields: pickup_location, name, email, phone, address, city, state, country, pin_code" 
          },
          { status: 400 }
        );
      }

      const sdk = getShiprocketSDK();
      const token = await sdk.auth.getToken();
      
      if (!token) {
        return NextResponse.json(
          { success: false, message: "Authentication failed" },
          { status: 401 }
        );
      }

      console.log("[Admin Pickup] Creating new pickup location:", pickup_location);

      // Call Shiprocket API to create pickup location
      const response = await sdk.http.post(
        "/settings/company/addpickup",
        {
          pickup_location,
          name,
          email,
          phone,
          address,
          address_2: address_2 || '',
          city,
          state,
          country,
          pin_code: pin_code.toString()
        },
        token
      );

      if (response.success) {
        return NextResponse.json({
          success: true,
          message: "Pickup location created successfully",
          data: {
            pickup_location,
            name,
            email,
            phone,
            address,
            city,
            state,
            country,
            pin_code
          }
        });
      } else {
        console.error("[Admin Pickup] Create API Error:", response.error);
        return NextResponse.json(
          { 
            success: false, 
            message: response.error?.message || "Failed to create pickup location" 
          },
          { status: 400 }
        );
      }
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

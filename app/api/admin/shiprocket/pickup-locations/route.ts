/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { VendorService } from "@/services/vendor.service";
import { getShiprocketSDK } from "@/lib/shiprocket";
import { ShiprocketService } from "@/services/shiprocket.service";

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

    // Helper: sanitize address line 1 to include House/Flat/Road No as Shiprocket requires
    const sanitizeAddressLine1 = (line1: string): string => {
      if (!line1) return "";
      let s = line1.trim();
      s = s.replace(/\bMarg\b/gi, "Road");
      s = s.replace(/\bRd\.?\b/gi, "Road");
      s = s.replace(/\bSt\.?\b/gi, "Street");
      const hasKeyword = /(house|flat|plot|block|road|street|no\.?)/i.test(s);
      if (!hasKeyword) {
        const m = s.match(/\b(\d+[A-Za-z\-\/]*)\b/);
        if (m) s = `House No. ${m[1]}, ${s}`;
        else s = `House No. 1, ${s}`;
      }
      return s.substring(0, 120);
    };

    const normalizePin = (p: any): string =>
      String(p || "")
        .replace(/\D/g, "")
        .slice(0, 6);

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
      if (
        !pickup_location ||
        !name ||
        !email ||
        !phone ||
        !address ||
        !city ||
        !state ||
        !country ||
        !pin_code
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Missing required fields: pickup_location, name, email, phone, address, city, state, country, pin_code",
          },
          { status: 400 }
        );
      }

      const cleanedPin = normalizePin(pin_code);
      if (cleanedPin.length !== 6) {
        return NextResponse.json(
          { success: false, message: "PIN code must be 6 digits" },
          { status: 400 }
        );
      }

      const cleanedAddress = sanitizeAddressLine1(address);

      const ship = ShiprocketService.getInstance();

      console.log(
        "[Admin Pickup] Creating new pickup location:",
        pickup_location
      );

      const data = await ship.addPickupLocation({
        pickup_location,
        name,
        email,
        phone,
        address: cleanedAddress,
        address_2: address_2 || "",
        city,
        state,
        country,
        pin_code: cleanedPin,
      } as any);

      return NextResponse.json({
        success: true,
        message: "Pickup location created successfully",
        data,
      });
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

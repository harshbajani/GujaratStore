/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getShiprocketSDK } from "@/lib/shiprocket";

export async function POST(request: Request) {
  try {
    const {
      pickup_postcode,
      delivery_postcode,
      weight,
      length,
      breadth,
      height,
      cod,
      declared_value,
    } = await request.json();

    // Basic validation
    if (!pickup_postcode || !delivery_postcode || !weight) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required parameters: pickup_postcode, delivery_postcode, weight",
        },
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

    // Prepare request data for Shiprocket rate calculation API
    const rateRequestData = {
      pickup_postcode: pickup_postcode.toString(),
      delivery_postcode: delivery_postcode.toString(),
      weight: parseFloat(weight.toString()),
      length: parseInt(length?.toString() || "10"),
      breadth: parseInt(breadth?.toString() || "10"),
      height: parseInt(height?.toString() || "10"),
      cod: parseInt(cod?.toString() || "0"),
      declared_value: parseFloat(declared_value?.toString() || "100"),
    };

    console.log(
      "[Shiprocket Rates] Calculating rates with data:",
      rateRequestData
    );

    // Call Shiprocket rate calculation API - Use GET with query parameters
    const queryParams = new URLSearchParams({
      pickup_postcode: rateRequestData.pickup_postcode,
      delivery_postcode: rateRequestData.delivery_postcode,
      weight: rateRequestData.weight.toString(),
      length: rateRequestData.length.toString(),
      breadth: rateRequestData.breadth.toString(),
      height: rateRequestData.height.toString(),
      cod: rateRequestData.cod.toString(),
      declared_value: rateRequestData.declared_value.toString(),
    });

    const response = await sdk.http.get(
      `/courier/serviceability/?${queryParams.toString()}`,
      token
    );

    if (response.success && response.data) {
      const responseData = response.data as any;
      const rates = responseData.data?.available_courier_companies || [];

      // Transform the response to a more usable format
      const transformedRates = rates
        .map((courier: any) => ({
          courier_name: courier.courier_name,
          rate: parseFloat(courier.rate || 0),
          estimated_delivery_date:
            courier.etd ||
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days default
          cod_charges: parseFloat(courier.cod_charges || 0),
          fuel_surcharge: parseFloat(courier.other_charges || 0),
          total_rate: parseFloat(courier.freight_charge || courier.rate || 0),
          description: courier.description,
          pickup_performance: courier.pickup_performance,
          delivery_performance: courier.delivery_performance,
        }))
        .sort((a: any, b: any) => a.total_rate - b.total_rate); // Sort by price

      return NextResponse.json({
        success: true,
        rates: transformedRates,
        request_data: rateRequestData,
      });
    } else {
      console.error("[Shiprocket Rates] API Error:", response.error);
      return NextResponse.json(
        {
          success: false,
          error:
            response.error?.message || "Failed to calculate shipping rates",
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("[Shiprocket Rates] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "An error occurred",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: "Method not allowed. Use POST to calculate rates.",
    },
    { status: 405 }
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { withAdminOrVendorAuth } from "@/lib/middleware/auth";

const BACKEND_URL =
  process.env.SHIPROCKET_BACKEND_URL || "http://localhost:8000";

export const POST = withAdminOrVendorAuth(async (request: Request) => {
  try {
    const body = await request.json();
    const { ids } = body;

    // Validate input
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Order IDs are required (array of strings)",
        },
        { status: 400 }
      );
    }

    // Proxy request to backend
    const response = await fetch(`${BACKEND_URL}/shiprocket/invoice/download`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ids }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[Shiprocket Invoice Download] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to download invoice",
      },
      { status: 500 }
    );
  }
});

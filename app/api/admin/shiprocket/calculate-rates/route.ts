/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.SHIPROCKET_BACKEND_URL || "http://localhost:8000";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Proxy request to backend
    const response = await fetch(`${BACKEND_URL}/shiprocket/rates/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[Shiprocket Rates Proxy] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Proxy error",
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

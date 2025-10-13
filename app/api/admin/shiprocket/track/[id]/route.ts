import { NextResponse } from "next/server";

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
    const type = searchParams.get("type") || "awb";

    // Proxy to backend
    const queryParams = new URLSearchParams({ type });
    const response = await fetch(`${BACKEND_URL}/shiprocket/track/${id}?${queryParams.toString()}`);
    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("[Shiprocket Track Proxy] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Proxy error"
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

import { NextResponse } from "next/server";
import { RazorpayService } from "@/services/razorpay.service";

export async function GET() {
  try {
    // Validate Razorpay configuration
    const configValidation = RazorpayService.validateConfiguration();
    
    if (!configValidation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Razorpay is not configured properly",
        },
        { status: 500 }
      );
    }

    // Get Razorpay Key ID (safe to expose to frontend)
    const keyId = RazorpayService.getRazorpayKeyId();

    if (!keyId) {
      return NextResponse.json(
        {
          success: false,
          error: "Razorpay Key ID not found",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Razorpay configuration retrieved successfully",
        data: {
          keyId,
          currency: "INR",
          theme: {
            color: "#DC2626", // Red color matching your theme
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get Razorpay config error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get Razorpay configuration",
      },
      { status: 500 }
    );
  }
}

// Handle other HTTP methods
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: "Method not allowed",
    },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    {
      success: false,
      error: "Method not allowed",
    },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    {
      success: false,
      error: "Method not allowed",
    },
    { status: 405 }
  );
}

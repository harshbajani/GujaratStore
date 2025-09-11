import { NextRequest, NextResponse } from "next/server";
import { sendPaymentFailureEmail } from "@/lib/workflows/emails";

export async function POST(request: NextRequest) {
  try {
    const emailData = await request.json();

    // Validate required fields
    if (!emailData.orderId || !emailData.userEmail || !emailData.userName) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required email data",
        },
        { status: 400 }
      );
    }

    // Send payment failure email
    await sendPaymentFailureEmail(emailData);

    return NextResponse.json(
      {
        success: true,
        message: "Payment failure email sent successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Payment failure email error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send payment failure email",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: "Method not allowed",
    },
    { status: 405 }
  );
}

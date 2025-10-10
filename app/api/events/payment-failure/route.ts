import { NextRequest, NextResponse } from "next/server";
import { inngest } from "@/lib/inngest/client";

export async function POST(request: NextRequest) {
  try {
    const emailData = await request.json();
    // Minimal validation
    if (!emailData?.orderId || !emailData?.userEmail) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    await inngest.send({
      name: "app/payment.failed",
      data: emailData,
    });

    return NextResponse.json({ success: true, message: "Payment failure email enqueued" });
  } catch (error) {
    console.error("Failed to enqueue payment failure email:", error);
    return NextResponse.json(
      { success: false, error: "Failed to enqueue payment failure email" },
      { status: 500 }
    );
  }
}

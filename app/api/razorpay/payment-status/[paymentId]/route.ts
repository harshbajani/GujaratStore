import { NextRequest, NextResponse } from "next/server";
import { RazorpayService } from "@/services/razorpay.service";

interface RouteParams {
  params: Promise<{
    paymentId: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { paymentId } = await params;

    // Basic validation: Ensure paymentId is provided
    if (!paymentId) {
      return NextResponse.json(
        {
          success: false,
          error: "Payment ID is required",
        },
        { status: 400 }
      );
    }

    // Fetch payment details from Razorpay
    const paymentDetails = await RazorpayService.fetchPayment(paymentId);

    if (!paymentDetails.success) {
      return NextResponse.json(
        {
          success: false,
          error: paymentDetails.message,
        },
        { status: 400 }
      );
    }

    const payment = paymentDetails.data;

    // Return relevant payment information
    return NextResponse.json(
      {
        success: true,
        data: {
          id: payment.id,
          status: payment.status,
          method: payment.method,
          amount: payment.amount,
          currency: payment.currency,
          created_at: payment.created_at,
          error_code: payment.error_code,
          error_description: payment.error_description,
          order_id: payment.order_id,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Fetch payment status error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch payment status",
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: "Method not allowed",
    },
    { status: 405 }
  );
}

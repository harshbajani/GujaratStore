import { NextRequest, NextResponse } from "next/server";
import { RazorpayService } from "@/services/razorpay.service";
import { z } from "zod";

// Request validation schema
const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1, "Razorpay order ID is required"),
  razorpay_payment_id: z.string().min(1, "Razorpay payment ID is required"),
  razorpay_signature: z.string().min(1, "Razorpay signature is required"),
  orderId: z.string().min(1, "Order ID is required"),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = verifyPaymentSchema.parse(body);

    // Verify payment signature
    const verificationResult = RazorpayService.verifyPaymentSignature({
      razorpay_order_id: validatedData.razorpay_order_id,
      razorpay_payment_id: validatedData.razorpay_payment_id,
      razorpay_signature: validatedData.razorpay_signature,
    });

    if (!verificationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: verificationResult.message,
        },
        { status: 400 }
      );
    }

    // Check if signature is valid
    if (!verificationResult.data) {
      return NextResponse.json(
        {
          success: false,
          error: "Payment signature verification failed",
        },
        { status: 400 }
      );
    }

    // Fetch payment details from Razorpay for additional validation
    const paymentDetails = await RazorpayService.fetchPayment(
      validatedData.razorpay_payment_id
    );

    if (!paymentDetails.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch payment details from Razorpay",
        },
        { status: 400 }
      );
    }

    // Check payment status
    const payment = paymentDetails.data;
    if (payment.status !== "captured" && payment.status !== "authorized") {
      return NextResponse.json(
        {
          success: false,
          error: `Payment not successful. Status: ${payment.status}`,
        },
        { status: 400 }
      );
    }

    // Payment verification successful
    // Note: For Razorpay payments, the order will be created after this verification
    // The order creation happens in the frontend after successful verification
    
    return NextResponse.json(
      {
        success: true,
        message: "Payment verified successfully",
        data: {
          paymentId: validatedData.razorpay_payment_id,
          orderId: validatedData.orderId,
          status: payment.status,
          amount: payment.amount,
          currency: payment.currency,
          method: payment.method,
          verifiedAt: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Verify payment error:", error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to verify payment",
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

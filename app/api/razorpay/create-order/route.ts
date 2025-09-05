import { NextRequest, NextResponse } from "next/server";
import { RazorpayService } from "@/services/razorpay.service";
import { z } from "zod";

// Request validation schema
const createOrderSchema = z.object({
  amount: z.number().min(1, "Amount must be greater than 0"),
  orderId: z.string().min(1, "Order ID is required"),
  currency: z.string().optional().default("INR"),
  notes: z.record(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Validate Razorpay configuration first
    const configValidation = RazorpayService.validateConfiguration();
    if (!configValidation.success) {
      return NextResponse.json(
        {
          success: false,
          error: configValidation.message,
        },
        { status: 500 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createOrderSchema.parse(body);

    // Create Razorpay order
    const razorpayOrderResult = await RazorpayService.createOrder({
      amount: validatedData.amount,
      receipt: validatedData.orderId,
      currency: validatedData.currency,
      notes: {
        ...validatedData.notes,
        orderId: validatedData.orderId,
        platform: "gujarat-store",
      },
    });

    if (!razorpayOrderResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: razorpayOrderResult.message,
        },
        { status: 400 }
      );
    }

    // Return successful response
    return NextResponse.json(
      {
        success: true,
        message: "Razorpay order created successfully",
        data: {
          razorpayOrderId: razorpayOrderResult.data!.id,
          amount: razorpayOrderResult.data!.amount,
          currency: razorpayOrderResult.data!.currency,
          orderId: validatedData.orderId,
          keyId: RazorpayService.getRazorpayKeyId(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create Razorpay order error:", error);

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
        error: error instanceof Error ? error.message : "Failed to create Razorpay order",
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

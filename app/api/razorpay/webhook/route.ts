import { NextRequest, NextResponse } from "next/server";
import { RazorpayService, WebhookEvent } from "@/services/razorpay.service";

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await request.text();
    
    // Get webhook signature from headers
    const webhookSignature = request.headers.get("x-razorpay-signature");
    
    if (!webhookSignature) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing webhook signature",
        },
        { status: 400 }
      );
    }

    // Verify webhook signature for security
    const signatureVerification = RazorpayService.verifyWebhookSignature(
      body,
      webhookSignature
    );

    if (!signatureVerification.success) {
      console.error("Webhook signature verification failed:", signatureVerification.message);
      return NextResponse.json(
        {
          success: false,
          error: "Webhook signature verification failed",
        },
        { status: 401 }
      );
    }

    if (!signatureVerification.data) {
      console.error("Invalid webhook signature");
      return NextResponse.json(
        {
          success: false,
          error: "Invalid webhook signature",
        },
        { status: 401 }
      );
    }

    // Parse webhook payload
    let webhookEvent: WebhookEvent;
    try {
      webhookEvent = JSON.parse(body);
    } catch (error) {
      console.error("Invalid JSON in webhook payload:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON payload",
        },
        { status: 400 }
      );
    }

    // Log webhook event for debugging
    console.log(`Received webhook event: ${webhookEvent.event} for entity: ${webhookEvent.entity}`);

    // Process the webhook event
    const processResult = await RazorpayService.processWebhookEvent(webhookEvent);

    if (!processResult.success) {
      console.error("Webhook processing failed:", processResult.message);
      // Still return 200 to avoid webhook retries for processing errors
      return NextResponse.json(
        {
          success: false,
          error: processResult.message,
        },
        { status: 200 } // Return 200 to acknowledge receipt
      );
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Webhook processed successfully",
        event: webhookEvent.event,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Webhook handler error:", error);
    
    // Return 200 to avoid webhook retries for server errors
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 200 }
    );
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: "Method not allowed. This endpoint only accepts POST requests.",
    },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    {
      success: false,
      error: "Method not allowed. This endpoint only accepts POST requests.",
    },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    {
      success: false,
      error: "Method not allowed. This endpoint only accepts POST requests.",
    },
    { status: 405 }
  );
}

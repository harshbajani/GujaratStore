import { sendOrderConfirmationEmail } from "@/lib/workflows/email";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const orderData = await request.json();

    // Send the order confirmation email
    await sendOrderConfirmationEmail(orderData);

    return NextResponse.json({
      success: true,
      message: "Order confirmation email sent successfully",
    });
  } catch (error) {
    console.error("Error sending order confirmation email:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to send order confirmation email",
      },
      { status: 500 }
    );
  }
}

import { sendOrderEmails } from "@/services/vendor.service";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const orderData = await request.json();

    // Send emails to all recipients
    const result = await sendOrderEmails(orderData);

    if (!result.success) {
      throw new Error(result.error);
    }

    return NextResponse.json({
      success: true,
      message: "Order confirmation emails sent successfully",
    });
  } catch (error) {
    console.error("Error sending order confirmation emails:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to send order confirmation emails",
      },
      { status: 500 }
    );
  }
}

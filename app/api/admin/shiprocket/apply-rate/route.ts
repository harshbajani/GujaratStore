import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import Order from "@/lib/models/order.model";

export async function POST(request: Request) {
  try {
    const {
      orderId,
      courierName,
      shippingRate,
      estimatedDelivery,
      rateDetails,
    } = await request.json();

    // Basic validation
    if (!orderId || !courierName || !shippingRate) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Missing required parameters: orderId, courierName, shippingRate" 
        },
        { status: 400 }
      );
    }

    await connectToDB();

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Update order with selected shipping information
    const updateData: any = {
      "shipping.preferred_courier": courierName,
      "shipping.calculated_rate": shippingRate,
      "shipping.rate_calculation_date": new Date(),
      "shipping.rate_details": rateDetails,
    };

    if (estimatedDelivery) {
      updateData["shipping.estimated_delivery"] = new Date(estimatedDelivery);
    }

    // Update delivery charges in order if different
    const currentDeliveryCharges = order.deliveryCharges || 0;
    const newDeliveryCharges = Math.round(shippingRate);
    
    if (currentDeliveryCharges !== newDeliveryCharges) {
      const difference = newDeliveryCharges - currentDeliveryCharges;
      updateData.deliveryCharges = newDeliveryCharges;
      updateData.total = order.total + difference;
      
      console.log(`[Apply Rate] Updated delivery charges: ${currentDeliveryCharges} -> ${newDeliveryCharges}, Total: ${order.total} -> ${order.total + difference}`);
    }

    await Order.findByIdAndUpdate(orderId, updateData);

    console.log(`[Apply Rate] Applied ${courierName} rate of ₹${shippingRate} to order ${order.orderId}`);

    return NextResponse.json({
      success: true,
      message: "Shipping rate applied successfully",
      data: {
        courierName,
        shippingRate,
        estimatedDelivery,
        deliveryCharges: newDeliveryCharges,
        total: updateData.total || order.total,
      },
    });

  } catch (error) {
    console.error("[Apply Rate] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "An error occurred"
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      success: false, 
      error: "Method not allowed. Use POST to apply shipping rate." 
    },
    { status: 405 }
  );
}

import { OrdersService } from "@/services/orders.service";
import { connectToDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import {
  sendAdminCancellationEmail,
  sendOrderCancellationEmail,
  sendVendorCancellationEmail,
  sendOrderReadyToShipEmail,
} from "@/lib/workflows/emails";
import User from "@/lib/models/user.model";
import Vendor from "@/lib/models/vendor.model";

export async function GET(request: Request, { params }: RouteParams) {
  try {
    // Establish database connection
    await connectToDB();

    const { id } = await params;

    // Basic validation: Ensure id is provided
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Order ID is required" },
        { status: 400 }
      );
    }

    const result = await OrdersService.getOrderById(id);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 404 }
      );
    }

    // Return the order data
    return NextResponse.json(
      { success: true, order: result.data },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "An error occurred",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const {
      status,
      cancellationReason,
      isVendorCancellation,
      isAdminCancellation,
    } = await request.json();

    // Basic validation: Ensure id is provided
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Order ID is required" },
        { status: 400 }
      );
    }

    // Basic validation: Ensure status is provided and valid
    if (!status) {
      return NextResponse.json(
        { success: false, message: "Status is required" },
        { status: 400 }
      );
    }

    // Validate status value
    const validStatuses = [
      "unconfirmed", // For payment pending orders
      "processing", // Default status after successful order/payment
      "ready to ship", // When order is picked and ready
      "delivered",
      "cancelled",
      "returned",
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status value" },
        { status: 400 }
      );
    }

    const result = await OrdersService.updateOrderStatus(id, status);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }

    // If the order is being cancelled, send a cancellation email
    if (status === "cancelled" && result.data) {
      try {
        const orderData = result.data as IOrder;
        // Get user details from the order's userId
        const user = await User.findById(orderData.userId);

        if (!user) {
          console.error("User not found for order cancellation email");
          return NextResponse.json(result, { status: 200 });
        }

        // Helper function to get vendor details from order items
        const getVendorDetails = async () => {
          try {
            // Get unique vendor IDs from order items
            const vendorIds = [
              ...new Set(
                orderData.items.map((item) => item.vendorId).filter(Boolean)
              ),
            ];

            if (vendorIds.length > 0) {
              // For now, get the first vendor (most orders will have items from one vendor)
              const vendor = await Vendor.findById(vendorIds[0]);
              if (vendor) {
                return {
                  vendorEmail: vendor.email,
                  vendorName:
                    vendor.name || vendor.store?.storeName || "Vendor",
                };
              }
            }
            return {
              vendorEmail: "contact@thegujaratstore.com",
              vendorName: "The Gujarat Store",
            };
          } catch (error) {
            console.error("Error fetching vendor details:", error);
            return {
              vendorEmail: "contact@thegujaratstore.com",
              vendorName: "The Gujarat Store",
            };
          }
        };

        // Get vendor details
        const { vendorEmail, vendorName } = await getVendorDetails();

        // Send status update email to customer (for specific status changes)
        if (status === "ready to ship") {
          // Send "ready to ship" notification to customer
          await sendOrderReadyToShipEmail({
            orderId: orderData.orderId,
            userName: user.name,
            userEmail: user.email,
            email: user.email,
            orderDate: orderData.createdAt,
            items: orderData.items,
            subtotal: orderData.subtotal,
            deliveryCharges: orderData.deliveryCharges,
            total: orderData.total,
            createdAt: orderData.createdAt,
            paymentOption: orderData.paymentOption,
            address: orderData.address || {
              name: "",
              contact: "",
              address_line_1: "",
              address_line_2: "",
              locality: "",
              state: "",
              pincode: "",
              type: "",
            },
            discountAmount: orderData.discountAmount,
          });
        }

        // If it's an admin cancellation
        if (isAdminCancellation) {
          if (!cancellationReason) {
            console.error(
              "Cancellation reason is required for admin cancellations"
            );
            return NextResponse.json(result, { status: 200 });
          }
          
          // Send cancellation email to customer with admin context
          await sendOrderCancellationEmail({
            orderId: orderData.orderId,
            userName: user.name,
            userEmail: user.email,
            email: user.email,
            orderDate: orderData.createdAt,
            items: orderData.items,
            subtotal: orderData.subtotal,
            deliveryCharges: orderData.deliveryCharges,
            total: orderData.total,
            createdAt: orderData.createdAt,
            paymentOption: orderData.paymentOption,
            address: orderData.address || {
              name: "",
              contact: "",
              address_line_1: "",
              address_line_2: "",
              locality: "",
              state: "",
              pincode: "",
              type: "",
            },
            discountAmount: orderData.discountAmount,
            cancellationReason: `${cancellationReason} (Cancelled by The Gujarat Store Team)`,
            reason: cancellationReason,
            customerName: user.name,
            vendorEmail: vendorEmail,
            paymentMethod: orderData.paymentOption,
            orderTotal: orderData.total.toString(),
            refundAmount: orderData.total.toString(),
          });
          
          // Also send admin notification for internal tracking
          await sendAdminCancellationEmail({
            orderId: orderData.orderId,
            userName: user.name,
            userEmail: user.email,
            email: user.email,
            orderDate: orderData.createdAt,
            items: orderData.items,
            subtotal: orderData.subtotal,
            deliveryCharges: orderData.deliveryCharges,
            total: orderData.total,
            createdAt: orderData.createdAt,
            paymentOption: orderData.paymentOption,
            address: orderData.address || {
              name: "",
              contact: "",
              address_line_1: "",
              address_line_2: "",
              locality: "",
              state: "",
              pincode: "",
              type: "",
            },
            discountAmount: orderData.discountAmount,
            cancellationReason: cancellationReason,
            reason: cancellationReason,
            customerName: user.name,
            vendorEmail: vendorEmail,
            paymentMethod: orderData.paymentOption,
            orderTotal: orderData.total.toString(),
            refundAmount: orderData.total.toString(),
          });
        } else if (isVendorCancellation) {
          if (!cancellationReason) {
            console.error(
              "Cancellation reason is required for vendor cancellations"
            );
            return NextResponse.json(result, { status: 200 });
          }
          
          // Send cancellation email to customer with vendor context
          await sendOrderCancellationEmail({
            orderId: orderData.orderId,
            userName: user.name,
            userEmail: user.email,
            email: user.email,
            orderDate: orderData.createdAt,
            items: orderData.items,
            subtotal: orderData.subtotal,
            deliveryCharges: orderData.deliveryCharges,
            total: orderData.total,
            createdAt: orderData.createdAt,
            paymentOption: orderData.paymentOption,
            address: orderData.address || {
              name: "",
              contact: "",
              address_line_1: "",
              address_line_2: "",
              locality: "",
              state: "",
              pincode: "",
              type: "",
            },
            discountAmount: orderData.discountAmount,
            cancellationReason: `${cancellationReason} (Cancelled by Vendor)`,
            reason: cancellationReason,
            customerName: user.name,
            vendorEmail: vendorEmail,
            paymentMethod: orderData.paymentOption,
            orderTotal: orderData.total.toString(),
            refundAmount: orderData.total.toString(),
          });
          
          // Also send vendor notification for internal tracking
          await sendVendorCancellationEmail({
            orderId: orderData.orderId,
            userName: user.name,
            userEmail: user.email,
            email: user.email,
            orderDate: orderData.createdAt,
            items: orderData.items,
            subtotal: orderData.subtotal,
            deliveryCharges: orderData.deliveryCharges,
            total: orderData.total,
            createdAt: orderData.createdAt,
            paymentOption: orderData.paymentOption,
            address: orderData.address || {
              name: "",
              contact: "",
              address_line_1: "",
              address_line_2: "",
              locality: "",
              state: "",
              pincode: "",
              type: "",
            },
            discountAmount: orderData.discountAmount,
            cancellationReason: cancellationReason,
            reason: cancellationReason,
            customerName: user.name,
            vendorEmail: vendorEmail,
            paymentMethod: orderData.paymentOption,
            orderTotal: orderData.total.toString(),
            refundAmount: orderData.total.toString(),
          });
        } else {
          // For user cancellations, use the regular cancellation email
          await sendOrderCancellationEmail({
            orderId: orderData.orderId,
            userName: user.name,
            userEmail: user.email,
            email: user.email,
            orderDate: orderData.createdAt,
            items: orderData.items,
            subtotal: orderData.subtotal,
            deliveryCharges: orderData.deliveryCharges,
            total: orderData.total,
            createdAt: orderData.createdAt,
            paymentOption: orderData.paymentOption,
            address: orderData.address || {
              name: "",
              contact: "",
              address_line_1: "",
              address_line_2: "",
              locality: "",
              state: "",
              pincode: "",
              type: "",
            },
            discountAmount: orderData.discountAmount,
            cancellationReason:
              cancellationReason || "User requested cancellation",
            reason: cancellationReason || "User requested cancellation",
            customerName: user.name,
            vendorEmail: vendorEmail,
            paymentMethod: orderData.paymentOption,
            orderTotal: orderData.total.toString(),
            refundAmount: orderData.total.toString(),
          });
        }
      } catch (emailError) {
        console.error("Failed to send cancellation email:", emailError);
        // Don't fail the request if email sending fails
      }
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "An error occurred",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Basic validation: Ensure id is provided
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Order ID is required" },
        { status: 400 }
      );
    }

    const result = await OrdersService.deleteOrder(id);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "An error occurred",
      },
      { status: 500 }
    );
  }
}

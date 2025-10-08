/* eslint-disable @typescript-eslint/no-explicit-any */
import { getCurrentVendor } from "@/lib/actions/vendor.actions";
import { OrdersService } from "@/services/orders.service";
import { connectToDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { withAdminOrVendorAuth } from "@/lib/middleware/auth";
import User from "@/lib/models/user.model";
import { inngest } from "@/lib/inngest/client";

export const POST = withAdminOrVendorAuth(async (request: Request) => {
  try {
    // Establish database connection
    await connectToDB();

    const orderData = await request.json();
    const result = await OrdersService.createOrder(orderData);

    if (!result.success) {
      // Check if it's a duplicate order ID error
      const isDuplicateError = result.message?.includes('duplicate') || 
                               result.message?.includes('11000');
      
      // Check for validation errors and make them user-friendly
      let userFriendlyMessage;
      if (isDuplicateError) {
        userFriendlyMessage = "Order processing failed due to a technical issue. Please try again.";
      } else if (result.message?.includes('vendorId') && result.message?.includes('required')) {
        userFriendlyMessage = "There was an issue with product information. Please refresh and try again.";
      } else if (result.message?.includes('selectedSize') && result.message?.includes('Cast to string failed')) {
        userFriendlyMessage = "There was an issue with size selection. Please check your selections and try again.";
      } else if (result.message?.includes('validation failed')) {
        userFriendlyMessage = "Please check that all required fields are filled and try again.";
      } else if (result.message?.includes('stock') || result.message?.includes('quantity')) {
        userFriendlyMessage = "Some items in your cart are out of stock. Please review your cart and try again.";
      } else {
        userFriendlyMessage = "Unable to process your order. Please try again or contact support if the issue persists.";
      }

      return NextResponse.json(
        { success: false, error: userFriendlyMessage },
        { status: 400 }
      );
    }

    // Fire-and-forget: enqueue order confirmation emails via Inngest
    try {
      const order: any = result.data;
      const user = await User.findById(order.userId).lean<{ name: string; email: string; addresses: IAddress[] }>();
      let address: IAddress | undefined;
      if (user?.addresses && order.addressId) {
        address = user.addresses.find((a: any) => a._id?.toString() === order.addressId?.toString());
      }

      await inngest.send({
        name: "app/order.confirmed",
        data: {
          orderId: order.orderId,
          items: order.items,
          subtotal: order.subtotal,
          deliveryCharges: order.deliveryCharges,
          discountAmount: order.discountAmount || 0,
          total: order.total,
          createdAt: order.createdAt,
          paymentOption: order.paymentOption,
          address: address || {
            name: "",
            contact: "",
            address_line_1: "",
            address_line_2: "",
            locality: "",
            state: "",
            pincode: "",
            type: "",
          },
          userName: user?.name || "",
          userEmail: user?.email || "",
          email: user?.email || "",
          orderDate: order.createdAt,
        },
      });
    } catch (e) {
      console.error("Failed to enqueue order confirmation emails:", e);
      // Do not block response
    }

    return NextResponse.json(
      { success: true, order: result.data },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Order API Error:", error);
    
    // Handle MongoDB duplicate key errors specifically
    if (error.code === 11000 && error.keyPattern?.orderId) {
      return NextResponse.json(
        {
          success: false,
          error: "Order processing failed due to a technical issue. Please try again.",
        },
        { status: 400 }
      );
    }

    // Generic error handling
    const userFriendlyMessage = "An unexpected error occurred while processing your order. Please try again.";
    
    return NextResponse.json(
      {
        success: false,
        error: userFriendlyMessage,
      },
      { status: 500 }
    );
  }
});

export const GET = withAdminOrVendorAuth(async (request: Request) => {
  try {
    await connectToDB();
    const { searchParams } = new URL(request.url);

    // Extract pagination parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as
      | "asc"
      | "desc";

    // Check if pagination is requested
    const usePagination = searchParams.get("paginate") === "true";

    // Extract filter parameters
    const status = searchParams.get("status");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    // Try to get the current vendor first
    const vendorResponse = await getCurrentVendor();

    if (usePagination) {
      // Use paginated response
      const paginationParams: PaginationParams & {
        userId?: string;
        status?: string;
        dateFrom?: string;
        dateTo?: string;
      } = {
        page,
        limit,
        search,
        sortBy,
        sortOrder,
        status: status || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      };

      // If vendor is authenticated, the service will handle vendor filtering internally
      if (!vendorResponse.success || !vendorResponse.data?._id) {
        // For non-vendor users, add userId if provided
        const userId = searchParams.get("userId");
        if (userId) paginationParams.userId = userId;
      }

      const result = await OrdersService.getOrdersPaginatedWithFilters(
        paginationParams
      );

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 400 }
        );
      }

      return NextResponse.json(result, { status: 200 });
    } else {
      // Use legacy non-paginated response
      let query: any = {};

      // If the vendor is authenticated, filter orders to include only those
      // that have at least one order item with a matching vendorId
      if (vendorResponse.success && vendorResponse.data?._id) {
        const vendorId = vendorResponse.data._id;
        query = { "items.vendorId": vendorId };

        // Optionally, if status filtering is provided
        if (status) query.status = status;
      } else {
        // Otherwise, fall back to user-based filtering (for a customer)
        const userId = searchParams.get("userId");
        if (userId) query.userId = userId;
        if (status) query.status = status;
      }

      const result = await OrdersService.getOrdersLegacy(query);

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.message },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { success: true, data: result.data },
        { status: 200 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "An error occurred",
      },
      { status: 500 }
    );
  }
});

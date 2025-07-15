/* eslint-disable @typescript-eslint/no-explicit-any */
import { getCurrentVendor } from "@/lib/actions/vendor.actions";
import { OrdersService } from "@/services/orders.service";
import { connectToDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // Establish database connection
    await connectToDB();

    const orderData = await request.json();
    const result = await OrdersService.createOrder(orderData);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, order: result.data },
      { status: 201 }
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

export async function GET(request: Request) {
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
}

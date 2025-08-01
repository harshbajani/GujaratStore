// app/api/discounts/route.ts (Vendor API)

import { DiscountService } from "@/services/discount.service";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentVendor } from "@/lib/actions/vendor.actions";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const categoryId = searchParams.get("categoryId");
    const isPublic = searchParams.get("public") === "true";

    // Get discount by ID
    if (id) {
      const result = await DiscountService.getDiscountById(id, false);
      return NextResponse.json(result);
    }

    // Get discounts by category ID
    if (categoryId) {
      const result = await DiscountService.getCategoryDiscounts(categoryId);
      return NextResponse.json(result);
    }

    // Get public discounts (no pagination)
    if (isPublic) {
      const result = await DiscountService.getPublicDiscounts();
      return NextResponse.json(result);
    }

    // Get vendor-specific discounts with pagination
    const vendorResponse = await getCurrentVendor();
    if (!vendorResponse.success) {
      return NextResponse.json(
        { success: false, message: "Not authenticated as vendor" },
        { status: 401 }
      );
    }

    // Extract pagination parameters
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as
      | "asc"
      | "desc";

    // Additional filters
    const isActive = searchParams.get("isActive");
    const discountType = searchParams.get("discountType");

    const paginationParams: PaginationParams = {
      page,
      limit,
      search,
      sortBy,
      sortOrder,
      // Add filters to params if needed
      ...(isActive !== null && { isActive: isActive === "true" }),
      ...(discountType && { discountType }),
    };

    const result = await DiscountService.getVendorDiscounts(
      vendorResponse.data?._id,
      paginationParams
    );
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in GET discounts:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const vendorResponse = await getCurrentVendor();
    if (!vendorResponse.success) {
      return NextResponse.json(
        { success: false, message: "Not authenticated as vendor" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Add vendor ID to the discount data
    const discountData = {
      ...body,
      vendorId: vendorResponse.data?._id,
      createdBy: vendorResponse.data?._id,
    };

    const result = await DiscountService.createDiscount(discountData, false);
    return NextResponse.json(result, { status: result.success ? 201 : 400 });
  } catch (error) {
    console.error("Error in POST discounts:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const vendorResponse = await getCurrentVendor();
    if (!vendorResponse.success) {
      return NextResponse.json(
        { success: false, message: "Not authenticated as vendor" },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (!body._id) {
      return NextResponse.json(
        { success: false, message: "Discount ID is required" },
        { status: 400 }
      );
    }

    // Add vendor ID to the update data
    const updateData = {
      ...body,
      vendorId: vendorResponse.data?._id,
    };

    const result = await DiscountService.updateDiscount(
      body._id,
      updateData,
      false
    );
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error("Error in PUT discounts:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const vendorResponse = await getCurrentVendor();
    if (!vendorResponse.success) {
      return NextResponse.json(
        { success: false, message: "Not authenticated as vendor" },
        { status: 401 }
      );
    }

    const id = request.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Discount ID is required" },
        { status: 400 }
      );
    }

    const result = await DiscountService.deleteDiscount(id, false);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error("Error in DELETE discounts:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

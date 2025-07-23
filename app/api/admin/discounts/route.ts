// app/api/admin/discounts/route.ts (Admin API)
import { DiscountService } from "@/services/discount.service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const categoryId = searchParams.get("categoryId");

    // Get discount by ID
    if (id) {
      const result = await DiscountService.getDiscountById(id, true);
      return NextResponse.json(result);
    }

    // Get discounts by category ID
    if (categoryId) {
      const result = await DiscountService.getCategoryDiscounts(categoryId);
      return NextResponse.json(result);
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
    const vendorId = searchParams.get("vendorId");

    const paginationParams: PaginationParams = {
      page,
      limit,
      search,
      sortBy,
      sortOrder,
      // Add filters to params if needed
      ...(isActive !== null && { isActive: isActive === "true" }),
      ...(discountType && { discountType }),
      ...(vendorId && { vendorId }),
    };

    // Get all discounts with pagination (admin view)
    const result = await DiscountService.getAllDiscounts(paginationParams);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in GET admin discounts:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await DiscountService.createDiscount(body, true);
    return NextResponse.json(result, { status: result.success ? 201 : 400 });
  } catch (error) {
    console.error("Error in POST admin discounts:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    if (!body._id) {
      return NextResponse.json(
        { success: false, message: "Discount ID is required" },
        { status: 400 }
      );
    }

    const result = await DiscountService.updateDiscount(body._id, body, true);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error("Error in PUT admin discounts:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Discount ID is required" },
        { status: 400 }
      );
    }

    const result = await DiscountService.deleteDiscount(id, true);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error("Error in DELETE admin discounts:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

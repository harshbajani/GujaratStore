import { DiscountService } from "@/services/discount.service";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentVendor } from "@/lib/actions/vendor.actions";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const isPublic = searchParams.get("public") === "true";

    if (id) {
      const result = await DiscountService.getDiscountById(id);
      return NextResponse.json(result);
    }

    if (isPublic) {
      const result = await DiscountService.getPublicDiscounts();
      return NextResponse.json(result);
    }

    const vendorResponse = await getCurrentVendor();
    if (!vendorResponse.success) {
      return NextResponse.json(
        { success: false, message: "Not authenticated as vendor" },
        { status: 401 }
      );
    }

    const result = await DiscountService.getVendorDiscounts(
      vendorResponse.data?._id
    );
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await DiscountService.createDiscount(body);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const result = await DiscountService.updateDiscount(body._id, body);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id)
      return NextResponse.json(
        { success: false, message: "Discount ID required" },
        { status: 400 }
      );

    const result = await DiscountService.deleteDiscount(id);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

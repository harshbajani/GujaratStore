// /app/api/admin/vendor/route.ts
import { NextRequest, NextResponse } from "next/server";
import { VendorService } from "@/services/vendor.service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  try {
    if (id) {
      const result = await VendorService.getVendorById(id);
      if (!result.success) {
        return NextResponse.json(
          { error: result.message },
          { status: 404 }
        );
      }
      return NextResponse.json(result.data, { status: 200 });
    } else {
      const result = await VendorService.getAllVendors();
      if (!result.success) {
        return NextResponse.json(
          { error: result.message },
          { status: 500 }
        );
      }
      return NextResponse.json(result.data, { status: 200 });
    }
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

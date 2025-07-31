import { NextRequest, NextResponse } from "next/server";
import { getAllBrands } from "@/lib/actions/brand.actions";
import { withAdminOrVendorAuth } from "@/lib/middleware/auth";

export const GET = withAdminOrVendorAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);

    const params = {
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "10"),
      search: searchParams.get("search") || "",
      sortBy: searchParams.get("sortBy") || "name",
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "asc",
    };

    const result = await getAllBrands(params);

    return NextResponse.json(result);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch brands" },
      { status: 500 }
    );
  }
});

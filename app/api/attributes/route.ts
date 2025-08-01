import { NextRequest, NextResponse } from "next/server";
import { getAllAttributes } from "@/lib/actions/attribute.actions";
import { withAdminOrVendorAuth } from "@/lib/middleware/auth";

export const GET = withAdminOrVendorAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "name";
    const sortOrder = (searchParams.get("sortOrder") || "asc") as
      | "asc"
      | "desc";

    const result = await getAllAttributes({
      page,
      limit,
      search,
      sortBy,
      sortOrder,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
});

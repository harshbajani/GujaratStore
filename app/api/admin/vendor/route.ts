import { NextRequest, NextResponse } from "next/server";
import { VendorService } from "@/services/vendor.service";
import { withAdminAuth } from "@/lib/middleware/auth";

export const GET = withAdminAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  // Check if pagination parameters are present
  const page = searchParams.get("page");
  const limit = searchParams.get("limit");
  const search = searchParams.get("search");
  const sortBy = searchParams.get("sortBy");
  const sortOrder = searchParams.get("sortOrder") as "asc" | "desc";

  try {
    if (id) {
      // Get specific vendor by ID
      const result = await VendorService.getVendorById(id);
      if (!result.success) {
        return NextResponse.json({ error: result.message }, { status: 404 });
      }
      return NextResponse.json(result.data, { status: 200 });
    } else if (page || limit || search || sortBy || sortOrder) {
      // Use paginated endpoint when pagination params are present
      const paginationParams = {
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
        search: search || undefined,
        sortBy: sortBy || undefined,
        sortOrder: sortOrder || undefined,
      };

      const result = await VendorService.getAllVendorsPaginated(
        paginationParams
      );
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }
      return NextResponse.json(result, { status: 200 });
    } else {
      // Use legacy endpoint when no pagination params
      const result = await VendorService.getAllVendors();
      if (!result.success) {
        return NextResponse.json({ error: result.message }, { status: 500 });
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
});

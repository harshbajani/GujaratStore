import { NextRequest, NextResponse } from "next/server";
import { ProductService } from "@/services/product.service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ brandId: string }> }
) {
  try {
    const { brandId } = await params;
    const { searchParams } = new URL(request.url);

    // Check if it's a legacy request (fetchAll or no pagination params)
    const fetchAll = searchParams.get("all") === "true";
    const page = searchParams.get("page");
    const limit = searchParams.get("limit");

    // If pagination parameters are present, use server-side pagination
    const usePagination =
      page || limit || searchParams.get("search") || searchParams.get("sortBy");

    if (usePagination && !fetchAll) {
      // Use paginated response
      const paginationParams: PaginationParams = {
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 10,
        search: searchParams.get("search") || "",
        sortBy: searchParams.get("sortBy") || "createdAt",
        sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
      };

      const result = await ProductService.getProductsByBrand(
        brandId,
        paginationParams
      );
      return NextResponse.json(result);
    } else {
      // Legacy behavior - fetch all products for the brand
      const result = await ProductService.getProductsByBrandLegacy(brandId);
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error("Error in GET products by brand:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

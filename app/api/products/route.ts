export const runtime = "nodejs";
import { connectToDB } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ProductService } from "@/services/product.service";

/**
 * Public API endpoint for fetching products without authentication
 * This is used by category pages and product listings for public users
 */
export async function GET(request: NextRequest) {
  try {
    await connectToDB();
    const searchParams = request.nextUrl.searchParams;

    // Check if it's a request to fetch all products
    const fetchAll = searchParams.get("all") === "true";
    const page = searchParams.get("page");
    const limit = searchParams.get("limit");
    const category = searchParams.get("category");
    const sortBy = searchParams.get("sortBy");
    const sortOrder = searchParams.get("sortOrder");

    console.log('Public products API called with params:', {
      fetchAll,
      page,
      limit,
      category,
      sortBy,
      sortOrder
    });

    // Use pagination if specific parameters are provided
    const usePagination = page || limit || sortBy;

    if (usePagination && !fetchAll) {
      // Use paginated response for public products (no vendorId filter)
      const paginationParams: PaginationParams = {
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 10,
        search: searchParams.get("search") || "",
        sortBy: sortBy || "createdAt",
        sortOrder: (sortOrder as "asc" | "desc") || "desc",
      };

      const result = await ProductService.getProducts(
        paginationParams
        // Note: No vendorId passed, so it fetches all products
      );

      console.log('Paginated result:', {
        success: result.success,
        totalItems: result.pagination?.totalItems,
        currentPage: result.pagination?.currentPage
      });

      return NextResponse.json(result);
    } else {
      // Legacy behavior - fetch all products
      console.log('Fetching all products (legacy)');
      const result = await ProductService.getProductsLegacy();
      
      console.log('Legacy result:', {
        success: result.success,
        totalProducts: result.data?.length,
        error: result.error
      });

      return NextResponse.json(result);
    }
  } catch (error) {
    console.error("Error in public products API:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

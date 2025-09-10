import { NextRequest, NextResponse } from "next/server";
import { BlogService } from "@/services/blog.service";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Get pagination parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "desc";

    // Check if it's a legacy request
    const usePagination = searchParams.get("page") || searchParams.get("limit") || searchParams.get("search");

    if (usePagination) {
      // Use paginated response
      const paginationParams: PaginationParams = {
        page,
        limit,
        search,
        sortBy,
        sortOrder,
      };

      const result = await BlogService.getBlogs(paginationParams);
      return NextResponse.json(result);
    } else {
      // Legacy behavior - fetch all blogs
      const result = await BlogService.getBlogsLegacy();
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error("Error in GET blogs:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Internal server error"
      },
      { status: 500 }
    );
  }
}

import { getAllUsers } from "@/lib/actions/admin/user.actions";
import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/middleware/auth";

export const GET = withAdminAuth(async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);

    // Extract pagination parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "name";
    const sortOrder = (searchParams.get("sortOrder") || "asc") as
      | "asc"
      | "desc";

    const paginationParams: PaginationParams = {
      page,
      limit,
      search,
      sortBy,
      sortOrder,
    };

    const result = await getAllUsers(paginationParams);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "An error occurred",
      },
      { status: 500 }
    );
  }
});

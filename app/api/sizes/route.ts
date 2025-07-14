import { NextRequest, NextResponse } from "next/server";
import { getAllSizes } from "@/lib/actions/size.actions";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const params = {
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "10"),
      search: searchParams.get("search") || "",
      sortBy: searchParams.get("sortBy") || "label",
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "asc",
    };

    const result = await getAllSizes(params);

    return NextResponse.json(result);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch sizes" },
      { status: 500 }
    );
  }
}

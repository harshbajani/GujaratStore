import { NextResponse } from "next/server";
import { getAllDropdownData } from "@/lib/actions/dropdown.actions";

export async function GET() {
  try {
    const result = await getAllDropdownData();

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 500 }
      );
    }

    const data = result.data!;

    // Group primary categories by parent category
    const navigationData = data.parentCategories.map((parentCategory) => ({
      _id: parentCategory._id,
      name: parentCategory.name,
      route: `/parent-category/${parentCategory._id}`, // You can customize this route
      primaryCategories: data.primaryCategories.filter(
        (primaryCategory) =>
          (typeof primaryCategory.parentCategory === "object"
            ? primaryCategory.parentCategory._id
            : primaryCategory.parentCategory) === parentCategory._id
      ),
    }));

    return NextResponse.json({
      success: true,
      data: navigationData,
      message: "Navigation data retrieved successfully",
    });
  } catch (error) {
    console.error("Navigation API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

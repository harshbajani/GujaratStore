import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import ParentCategory from "@/lib/models/parentCategory.model";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    await connectToDB();
    const { slug } = await params;

    const parentCategory = await ParentCategory.findOne({ slug, isActive: true })
      .lean();

    if (!parentCategory) {
      return NextResponse.json(
        { success: false, error: "Parent category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: parentCategory });
  } catch (error: unknown) {
    console.error("Error in GET parent category by slug:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

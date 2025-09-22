import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import PrimaryCategory from "@/lib/models/primaryCategory.model";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    await connectToDB();
    const { slug } = await params;

    const primaryCategory = await PrimaryCategory.findOne({ slug, isActive: true })
      .populate('parentCategory', 'name slug')
      .lean();

    if (!primaryCategory) {
      return NextResponse.json(
        { success: false, error: "Primary category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: primaryCategory });
  } catch (error: unknown) {
    console.error("Error in GET primary category by slug:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

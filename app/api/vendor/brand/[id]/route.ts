import Brand from "@/lib/models/brand.model";

import { NextResponse } from "next/server";

export async function PUT(req: Request, { params }: RouteParams) {
  const id = (await params).id;
  const body = await req.json();

  try {
    // Find the existing brand
    const existingBrand = await Brand.findById(id);

    if (!existingBrand) {
      return NextResponse.json(
        { success: false, error: "Brand not found" },
        { status: 404 }
      );
    }

    // Retain the existing imageId if no new imageId is provided
    if (!body.imageId) {
      body.imageId = existingBrand.imageId;
    }

    const updatedBrand = await Brand.findByIdAndUpdate(id, body, { new: true });

    return NextResponse.json({ success: true, data: updatedBrand });
  } catch (error) {
    console.error("Error updating brand:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}

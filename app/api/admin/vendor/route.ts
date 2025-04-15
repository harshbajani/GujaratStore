// /app/api/admin/vendor/route.ts
import Vendor from "@/lib/models/vendor.model";
import { connectToDB } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Parse the query string to see if an ID is provided
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  try {
    // Connect to the database
    await connectToDB();

    if (id) {
      // If an id is provided, fetch a single vendor by id
      const vendor = await Vendor.findById(id);
      if (!vendor) {
        return NextResponse.json(
          { error: "Vendor not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(vendor, { status: 200 });
    } else {
      // Otherwise, fetch all vendors
      const vendors = await Vendor.find({});
      return NextResponse.json(vendors, { status: 200 });
    }
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

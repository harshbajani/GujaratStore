import { NextResponse } from "next/server";
import { DropdownService } from "@/services/dropdown.service";
import { withAdminOrVendorAuth } from "@/lib/middleware/auth";

export const GET = withAdminOrVendorAuth(async () => {
  try {
    const result = await DropdownService.getAllDropdownData();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Dropdown API error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch dropdown data",
      },
      { status: 500 }
    );
  }
});

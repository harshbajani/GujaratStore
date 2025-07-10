import { NextResponse } from "next/server";
import { DropdownService } from "@/services/dropdown.service";

export async function GET() {
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
}

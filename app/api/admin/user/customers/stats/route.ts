import { getCustomerStatsForAdmin } from "@/lib/actions/admin/user.actions";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const result = await getCustomerStatsForAdmin();

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
}

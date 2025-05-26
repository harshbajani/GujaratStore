/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server";
import { getCurrentVendor } from "@/lib/actions/vendor.actions";
import { DashboardService } from "@/services/dashboard.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    const vendorResponse = await getCurrentVendor();
    if (!vendorResponse.success || !vendorResponse.data?._id) {
      return NextResponse.json(
        { success: false, error: "Not authenticated as vendor" },
        { status: 401 }
      );
    }

    const dashboardService = DashboardService.getInstance();
    const vendorId = vendorResponse.data._id.toString();

    const [salesSummary, orderStatusBreakdown, productInventoryStats] =
      await Promise.all([
        dashboardService.getSalesSummary(
          vendorId,
          month ? parseInt(month) : undefined,
          year ? parseInt(year) : undefined
        ),
        dashboardService.getOrderStatusBreakdown(
          vendorId,
          month ? parseInt(month) : undefined,
          year ? parseInt(year) : undefined
        ),
        dashboardService.getInventoryStats(vendorId),
      ]);

    return NextResponse.json(
      {
        success: true,
        data: {
          salesSummary,
          orderStatusBreakdown,
          productInventoryStats,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Dashboard Analytics Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "An error occurred",
      },
      { status: 500 }
    );
  }
}

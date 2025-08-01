/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server";
import { getCurrentVendor } from "@/lib/actions/vendor.actions";
import { DashboardService } from "@/services/dashboard.service";
import Order from "@/lib/models/order.model";

async function calculateSalesSummary(
  vendorId: string,
  month?: number,
  year?: number
): Promise<any> {
  // Build query based on month and year
  const query: any = { "items.vendorId": vendorId };
  if (month !== undefined && year !== undefined) {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    query.createdAt = { $gte: startDate, $lte: endDate };
  }

  // Get filtered orders
  const orders = await Order.find(query);

  // Calculate total revenue
  const totalRevenue = orders.reduce(
    (sum: number, order: any) => sum + order.total,
    0
  );
  const totalOrders = orders.length;
  const averageOrderValue = totalRevenue / totalOrders || 0;

  // Monthly revenue calculation
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const monthlyRevenue = months.reduce((acc, month) => {
    acc[month] = 0;
    return acc;
  }, {} as { [month: string]: number });

  // Update monthly revenue with actual data
  orders.forEach((order: any) => {
    const month = new Date(order.createdAt).toLocaleString("default", {
      month: "short",
    });
    monthlyRevenue[month] = (monthlyRevenue[month] || 0) + order.total;
  });

  // Use provided month/year or default to current
  let selectedYear, selectedMonth;
  if (month !== undefined && year !== undefined) {
    selectedYear = year;
    selectedMonth = month;
  } else {
    const currentDate = new Date();
    selectedYear = currentDate.getFullYear();
    selectedMonth = currentDate.getMonth();
  }

  // Get previous month and year
  const previousMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
  const previousYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;

  // Calculate selected month revenue for this vendor
  const selectedMonthStartDate = new Date(selectedYear, selectedMonth, 1);
  const selectedMonthEndDate = new Date(selectedYear, selectedMonth + 1, 0);
  const selectedMonthOrders = await Order.find({
    createdAt: { $gte: selectedMonthStartDate, $lte: selectedMonthEndDate },
    "items.vendorId": vendorId,
  });
  const selectedMonthRevenue = selectedMonthOrders.reduce(
    (sum: number, order: any) => sum + order.total,
    0
  );

  // Calculate previous month revenue for this vendor
  const previousMonthStartDate = new Date(previousYear, previousMonth, 1);
  const previousMonthEndDate = new Date(previousYear, previousMonth + 1, 0);
  const previousMonthOrders = await Order.find({
    createdAt: { $gte: previousMonthStartDate, $lte: previousMonthEndDate },
    "items.vendorId": vendorId,
  });
  const previousMonthRevenue = previousMonthOrders.reduce(
    (sum: number, order: any) => sum + order.total,
    0
  );

  // Calculate percentage change
  const revenueChangePercent =
    previousMonthRevenue !== 0
      ? ((selectedMonthRevenue - previousMonthRevenue) / previousMonthRevenue) *
        100
      : selectedMonthRevenue > 0
      ? 100
      : 0;

  // Yearly revenue calculation (reuse your existing logic or add here)
  let yearlyRevenue = {};
  if (typeof calculateYearlyRevenue === "function") {
    yearlyRevenue = await calculateYearlyRevenue(vendorId);
  }

  // Top selling products (reuse your existing logic or add here)
  let topSellingProducts: any = [];
  if (typeof calculateTopSellingProducts === "function") {
    topSellingProducts = await calculateTopSellingProducts(query);
  }

  return {
    totalRevenue,
    totalOrders,
    averageOrderValue,
    monthlyRevenue,
    yearlyRevenue,
    topSellingProducts,
    revenueChangePercent,
  };
}

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
        calculateSalesSummary(
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

async function calculateYearlyRevenue(vendorId: string) {
  const currentYear = new Date().getFullYear();
  const fiveYearsAgo = currentYear - 4;

  const yearlyRevenueData = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(fiveYearsAgo, 0, 1),
          $lte: new Date(currentYear, 11, 31),
        },
        "items.vendorId": vendorId,
      },
    },
    {
      $group: {
        _id: { $year: "$createdAt" },
        totalRevenue: { $sum: "$total" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const allYearsRevenue: { [year: number]: number } = {};
  for (let year = fiveYearsAgo; year <= currentYear; year++) {
    allYearsRevenue[year] = 0;
  }
  yearlyRevenueData.forEach((year) => {
    allYearsRevenue[year._id] = year.totalRevenue;
  });
  return allYearsRevenue;
}

async function calculateTopSellingProducts(query: any = {}) {
  const topProducts = await Order.aggregate([
    { $match: query },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.productId",
        productName: { $first: "$items.productName" },
        quantity: { $sum: "$items.quantity" },
        revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
      },
    },
    { $sort: { quantity: -1 } },
    { $limit: 5 },
  ]);

  return topProducts.map((product) => ({
    productId: product._id,
    productName: product.productName,
    quantity: product.quantity,
    revenue: product.revenue,
  }));
}

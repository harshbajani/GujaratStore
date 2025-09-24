/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import Order from "@/lib/models/order.model";
import Products from "@/lib/models/product.model";
import { connectToDB } from "@/lib/mongodb";
import { withAdminAuth } from "@/lib/middleware/auth";

export const GET = withAdminAuth(async (request: Request) => {
  try {
    await connectToDB();

    // Extract month and year from query parameters
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    // Sales Summary
    const salesSummary = await calculateSalesSummary(
      month ? parseInt(month) : undefined,
      year ? parseInt(year) : undefined
    );

    // Order Status Breakdown
    const orderStatusBreakdown = await calculateOrderStatusBreakdown(
      month ? parseInt(month) : undefined,
      year ? parseInt(year) : undefined
    );

    // Product Inventory Stats
    const productInventoryStats = await calculateProductInventoryStats(
      month ? parseInt(month) : undefined,
      year ? parseInt(year) : undefined
    );

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
});

async function calculateSalesSummary(
  month?: number,
  year?: number
): Promise<ISalesSummary> {
  // Build query based on month and year
  const query: any = {};
  if (month !== undefined && year !== undefined) {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    query.createdAt = { $gte: startDate, $lte: endDate };
  }

  // Get filtered orders
  const orders = await Order.find(query);

  // Calculate total revenue
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
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
  orders.forEach((order) => {
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

  // Calculate selected month revenue
  const selectedMonthStartDate = new Date(selectedYear, selectedMonth, 1);
  const selectedMonthEndDate = new Date(selectedYear, selectedMonth + 1, 0);

  const selectedMonthOrders = await Order.find({
    createdAt: { $gte: selectedMonthStartDate, $lte: selectedMonthEndDate },
  });
  const selectedMonthRevenue = selectedMonthOrders.reduce(
    (sum, order) => sum + order.total,
    0
  );

  // Calculate previous month revenue
  const previousMonthStartDate = new Date(previousYear, previousMonth, 1);
  const previousMonthEndDate = new Date(previousYear, previousMonth + 1, 0);

  const previousMonthOrders = await Order.find({
    createdAt: { $gte: previousMonthStartDate, $lte: previousMonthEndDate },
  });
  const previousMonthRevenue = previousMonthOrders.reduce(
    (sum, order) => sum + order.total,
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

  // Yearly revenue calculation
  const yearlyRevenue = await calculateYearlyRevenue();

  // Top selling products
  const topSellingProducts = await calculateTopSellingProducts(query);

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

async function calculateYearlyRevenue() {
  const currentYear = new Date().getFullYear();
  const fiveYearsAgo = currentYear - 4; // This will give us last 5 years including current year

  const yearlyRevenueData = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(fiveYearsAgo, 0, 1), // January 1st of 5 years ago
          $lte: new Date(currentYear, 11, 31), // December 31st of current year
        },
      },
    },
    {
      $group: {
        _id: { $year: "$createdAt" },
        totalRevenue: { $sum: "$total" },
      },
    },
    { $sort: { _id: 1 } }, // Sort by year ascending
  ]);

  // Create an object with all years (including those with zero revenue)
  const allYearsRevenue: { [year: number]: number } = {};
  for (let year = fiveYearsAgo; year <= currentYear; year++) {
    allYearsRevenue[year] = 0;
  }

  // Fill in actual revenue data
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

async function calculateOrderStatusBreakdown(
  month?: number,
  year?: number
): Promise<IOrderStatusBreakdown> {
  // Build query based on month and year
  const query: any = {};
  if (month !== undefined && year !== undefined) {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    query.createdAt = { $gte: startDate, $lte: endDate };
  }

  const statusBreakdown = await Order.aggregate([
    { $match: query },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const breakdown = statusBreakdown.reduce(
    (acc, status) => {
      acc[status._id] = status.count;
      return acc;
    },
    {
      confirmed: 0,
      processing: 0,
      "ready to ship": 0,
      delivered: 0,
      cancelled: 0,
      returned: 0,
    }
  );

  return breakdown;
}

async function calculateProductInventoryStats(
  month?: number,
  year?: number
): Promise<IProductInventoryStats> {
  // Note: Product inventory stats are typically not time-dependent
  const totalProducts = await Products.countDocuments();
  const lowStockProducts = await Products.countDocuments({
    productQuantity: { $lt: 10 },
  });
  const outOfStockProducts = await Products.countDocuments({
    productQuantity: 0,
  });

  // Get products with low stock and their details
  const lowStockProductDetails = await Products.find({
    productQuantity: { $lt: 10 },
  }).select("productName productQuantity");

  const inventoryValueTotal = await Products.aggregate([
    {
      $group: {
        _id: null,
        totalValue: { $sum: { $multiply: ["$productQuantity", "$netPrice"] } },
      },
    },
  ]);

  return {
    totalProducts,
    lowStockProducts,
    outOfStockProducts,
    inventoryValueTotal: inventoryValueTotal[0]?.totalValue || 0,
    lowStockProductDetails: lowStockProductDetails.map((product) => ({
      name: product.productName,
      quantity: product.productQuantity,
    })),
  };
}

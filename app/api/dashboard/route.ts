/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server";
import Order from "@/lib/models/order.model";
import Products from "@/lib/models/product.model";
import { connectToDB } from "@/lib/mongodb";
import { getCurrentVendor } from "@/lib/actions/vendor.actions";
import {
  ISalesSummary,
  IOrderStatusBreakdown,
  IProductInventoryStats,
} from "@/types";
import mongoose from "mongoose";

export async function GET(request: Request) {
  try {
    await connectToDB();
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    // Get current vendor for vendor-specific stats
    const vendorResponse = await getCurrentVendor();
    if (!vendorResponse.success || !vendorResponse.data?._id) {
      return NextResponse.json(
        { success: false, error: "Not authenticated as vendor" },
        { status: 401 }
      );
    }
    const vendorId = vendorResponse.data._id.toString();

    // Sales Summary: only include orders that have at least one item with this vendorId
    const salesSummary = await calculateSalesSummary(
      vendorId,
      month ? parseInt(month) : undefined,
      year ? parseInt(year) : undefined
    );

    // Order Status Breakdown: filter orders by vendor items
    const orderStatusBreakdown = await calculateOrderStatusBreakdown(
      vendorId,
      month ? parseInt(month) : undefined,
      year ? parseInt(year) : undefined
    );

    // Product Inventory Stats: only for products that belong to this vendor
    const productInventoryStats = await calculateProductInventoryStats(
      vendorId,
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
  } catch (error: unknown) {
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

async function calculateSalesSummary(
  vendorId: string,
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
  // Include only orders that have at least one item from this vendor
  query["items.vendorId"] = new mongoose.Types.ObjectId(vendorId);

  const orders = await Order.find(query);
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = orders.length;
  const averageOrderValue = totalRevenue / totalOrders || 0;

  // Monthly revenue calculation for all orders (for this vendor)
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
  const monthlyRevenue = months.reduce((acc, m) => {
    acc[m] = 0;
    return acc;
  }, {} as { [month: string]: number });

  orders.forEach((order) => {
    const m = new Date(order.createdAt).toLocaleString("default", {
      month: "short",
    });
    monthlyRevenue[m] = (monthlyRevenue[m] || 0) + order.total;
  });

  // Calculate revenue change percentage from last month to current month
  // Use the current date to determine the months.
  const currentDate = new Date();
  const currentMonthStr = currentDate.toLocaleString("default", {
    month: "short",
  });
  const lastMonthDate = new Date(currentDate);
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  const lastMonthStr = lastMonthDate.toLocaleString("default", {
    month: "short",
  });

  const currentRevenue = monthlyRevenue[currentMonthStr] || 0;
  const lastRevenue = monthlyRevenue[lastMonthStr] || 0;
  const revenueChangePercent =
    lastRevenue !== 0
      ? ((currentRevenue - lastRevenue) / lastRevenue) * 100
      : 0;

  // Yearly revenue calculation
  const yearlyRevenue = await calculateYearlyRevenue(vendorId);

  // Top selling products aggregation remains unchanged
  const topSellingProducts = await calculateTopSellingProducts(query);

  return {
    totalRevenue,
    totalOrders,
    averageOrderValue,
    monthlyRevenue,
    yearlyRevenue,
    topSellingProducts,
    revenueChangePercent, // Add the calculated percentage change here
  };
}

async function calculateYearlyRevenue(vendorId: string) {
  const currentYear = new Date().getFullYear();
  const fiveYearsAgo = currentYear - 4; // last 5 years including current
  const vendorObjectId = new mongoose.Types.ObjectId(vendorId);

  const yearlyRevenueData = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(fiveYearsAgo, 0, 1),
          $lte: new Date(currentYear, 11, 31),
        },
        "items.vendorId": vendorObjectId,
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
  for (let yr = fiveYearsAgo; yr <= currentYear; yr++) {
    allYearsRevenue[yr] = 0;
  }

  yearlyRevenueData.forEach((entry) => {
    allYearsRevenue[entry._id] = entry.totalRevenue;
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
  vendorId: string,
  month?: number,
  year?: number
): Promise<IOrderStatusBreakdown> {
  const query: any = {};
  if (month !== undefined && year !== undefined) {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    query.createdAt = { $gte: startDate, $lte: endDate };
  }
  // Convert vendorId to ObjectId so that the match works correctly in aggregation
  query["items.vendorId"] = new mongoose.Types.ObjectId(vendorId);

  const statusBreakdown = await Order.aggregate([
    { $match: query },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  // Build a default breakdown in case some statuses are missing
  const breakdown: IOrderStatusBreakdown = {
    confirmed: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    returned: 0,
  };

  statusBreakdown.forEach((entry) => {
    breakdown[entry._id as keyof IOrderStatusBreakdown] = entry.count;
  });

  return breakdown;
}

async function calculateProductInventoryStats(
  vendorId: string,
  month?: number,
  year?: number
): Promise<IProductInventoryStats> {
  // You can let .countDocuments handle vendorId conversion if needed
  const totalProducts = await Products.countDocuments({ vendorId });
  const lowStockProducts = await Products.countDocuments({
    vendorId,
    productQuantity: { $lt: 10 },
  });
  const outOfStockProducts = await Products.countDocuments({
    vendorId,
    productQuantity: 0,
  });

  const lowStockProductDetails = await Products.find({
    vendorId,
    productQuantity: { $lt: 10 },
  }).select("productName productQuantity");

  // Convert vendorId to ObjectId for the aggregation pipeline
  const vendorObjectId = new mongoose.Types.ObjectId(vendorId);

  const inventoryValueTotalAgg = await Products.aggregate([
    { $match: { vendorId: vendorObjectId } },
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
    inventoryValueTotal: inventoryValueTotalAgg[0]?.totalValue || 0,
    lowStockProductDetails: lowStockProductDetails.map((product) => ({
      name: product.productName,
      quantity: product.productQuantity,
    })),
  };
}

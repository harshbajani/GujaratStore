/* eslint-disable @typescript-eslint/no-explicit-any */
import { Types } from "mongoose";
import Order from "@/lib/models/order.model";
import Products from "@/lib/models/product.model";
import { CacheService } from "./cache.service";

export class DashboardService {
  private static instance: DashboardService;

  private constructor() {}

  public static getInstance(): DashboardService {
    if (!DashboardService.instance) {
      DashboardService.instance = new DashboardService();
    }
    return DashboardService.instance;
  }

  async getSalesSummary(
    vendorId: string,
    month?: number,
    year?: number
  ): Promise<ISalesSummary> {
    const cacheKey = `sales:${vendorId}:${month}:${year}`;
    const cached = await CacheService.get<ISalesSummary>(cacheKey);

    if (cached) {
      return cached;
    }

    const query = this.buildTimeRangeQuery(month, year);
    query["items.vendorId"] = new Types.ObjectId(vendorId);

    const orders = await Order.find(query);
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalRevenue / totalOrders || 0;

    const monthlyRevenue = await this.calculateMonthlyRevenue(orders);
    const yearlyRevenue = await this.calculateYearlyRevenue(vendorId);
    const revenueChangePercent = await this.calculateRevenueChange(
      vendorId,
      month,
      year
    );
    const topSellingProducts = await this.calculateTopSellingProducts(query);

    const summary = {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      monthlyRevenue,
      yearlyRevenue,
      topSellingProducts,
      revenueChangePercent,
    };

    // Set cache with 10 minutes TTL (600 seconds)
    await CacheService.set(cacheKey, summary, 600);
    return summary;
  }

  async getOrderStatusBreakdown(
    vendorId: string,
    month?: number,
    year?: number
  ): Promise<IOrderStatusBreakdown> {
    const cacheKey = `orders:${vendorId}:${month}:${year}`;
    const cached = await CacheService.get<IOrderStatusBreakdown>(cacheKey);

    if (cached) {
      return cached;
    }

    const query = this.buildTimeRangeQuery(month, year);
    query["items.vendorId"] = new Types.ObjectId(vendorId);

    const statusBreakdown = await Order.aggregate([
      { $match: query },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const breakdown = this.normalizeOrderBreakdown(statusBreakdown);

    // Set cache with 5 minutes TTL (300 seconds) - order status changes more frequently
    await CacheService.set(cacheKey, breakdown, 300);
    return breakdown;
  }

  async getInventoryStats(vendorId: string): Promise<IProductInventoryStats> {
    const cacheKey = `inventory:${vendorId}`;
    const cached = await CacheService.get<IProductInventoryStats>(cacheKey);

    if (cached) {
      return cached;
    }

    const vendorObjectId = new Types.ObjectId(vendorId);

    const [
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      lowStockDetails,
      inventoryValue,
    ] = await Promise.all([
      Products.countDocuments({ vendorId }),
      Products.countDocuments({ vendorId, productQuantity: { $lt: 10 } }),
      Products.countDocuments({ vendorId, productQuantity: 0 }),
      Products.find({ vendorId, productQuantity: { $lt: 10 } }).select(
        "productName productQuantity"
      ),
      Products.aggregate([
        { $match: { vendorId: vendorObjectId } },
        {
          $group: {
            _id: null,
            totalValue: {
              $sum: { $multiply: ["$productQuantity", "$netPrice"] },
            },
          },
        },
      ]),
    ]);

    const stats = {
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      inventoryValueTotal: inventoryValue[0]?.totalValue || 0,
      lowStockProductDetails: lowStockDetails.map((product) => ({
        name: product.productName,
        quantity: product.productQuantity,
      })),
    };

    // Set cache with 15 minutes TTL (900 seconds) - inventory changes less frequently
    await CacheService.set(cacheKey, stats, 900);
    return stats;
  }

  private buildTimeRangeQuery(month?: number, year?: number) {
    const query: any = {};
    if (month !== undefined && year !== undefined) {
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);
      query.createdAt = { $gte: startDate, $lte: endDate };
    }
    return query;
  }

  private async calculateMonthlyRevenue(
    orders: any[]
  ): Promise<{ [month: string]: number }> {
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
    const monthlyRevenue: { [key: string]: number } = months.reduce(
      (acc, m) => ({ ...acc, [m]: 0 }),
      {}
    );

    orders.forEach((order) => {
      const month = new Date(order.createdAt).toLocaleString("default", {
        month: "short",
      });
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + order.total;
    });

    return monthlyRevenue;
  }

  private async calculateYearlyRevenue(
    vendorId: string
  ): Promise<{ [year: number]: number }> {
    const currentYear = new Date().getFullYear();
    const fiveYearsAgo = currentYear - 4;
    const vendorObjectId = new Types.ObjectId(vendorId);

    const yearlyData = await Order.aggregate([
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

    return Object.fromEntries(
      Array.from({ length: 5 }, (_, i) => [fiveYearsAgo + i, 0]).map(
        ([year]) => [
          year,
          yearlyData.find((d) => d._id === year)?.totalRevenue || 0,
        ]
      )
    );
  }

  // Change signature to accept month/year
  private async calculateRevenueChange(
    vendorId: string,
    month?: number,
    year?: number
  ): Promise<number> {
    const vendorObjectId = new Types.ObjectId(vendorId);

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
      "items.vendorId": vendorObjectId,
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
      "items.vendorId": vendorObjectId,
    });
    const previousMonthRevenue = previousMonthOrders.reduce(
      (sum, order) => sum + order.total,
      0
    );

    // Calculate percentage change
    return previousMonthRevenue !== 0
      ? ((selectedMonthRevenue - previousMonthRevenue) / previousMonthRevenue) *
          100
      : selectedMonthRevenue > 0
      ? 100
      : 0;
  }

  private async calculateTopSellingProducts(query: any) {
    return Order.aggregate([
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
    ]).then((products) =>
      products.map((p) => ({
        productId: p._id,
        productName: p.productName,
        quantity: p.quantity,
        revenue: p.revenue,
      }))
    );
  }

  private normalizeOrderBreakdown(
    statusBreakdown: any[]
  ): IOrderStatusBreakdown {
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

  async invalidateSalesCache(vendorId: string): Promise<void> {
    try {
      // Get all keys that match the sales pattern for this vendor
      const keys = await CacheService.keys(`sales:${vendorId}:*`);
      await Promise.all(keys.map((key) => CacheService.delete(key)));
    } catch (error) {
      console.error("Sales cache invalidation error:", error);
    }
  }

  async invalidateOrdersCache(vendorId: string): Promise<void> {
    try {
      // Get all keys that match the orders pattern for this vendor
      const keys = await CacheService.keys(`orders:${vendorId}:*`);
      await Promise.all(keys.map((key) => CacheService.delete(key)));
    } catch (error) {
      console.error("Orders cache invalidation error:", error);
    }
  }

  async invalidateInventoryCache(vendorId: string): Promise<void> {
    try {
      // Delete inventory cache for this vendor
      await CacheService.delete(`inventory:${vendorId}`);
    } catch (error) {
      console.error("Inventory cache invalidation error:", error);
    }
  }

  // Master method to invalidate all dashboard caches for a vendor
  async invalidateAllDashboardCaches(vendorId: string): Promise<void> {
    try {
      await Promise.all([
        this.invalidateSalesCache(vendorId),
        this.invalidateOrdersCache(vendorId),
        this.invalidateInventoryCache(vendorId),
      ]);
    } catch (error) {
      console.error("Dashboard cache invalidation error:", error);
    }
  }

  // Call this method when orders are created/updated/deleted
  async onOrderChange(vendorId: string): Promise<void> {
    await Promise.all([
      this.invalidateSalesCache(vendorId),
      this.invalidateOrdersCache(vendorId),
    ]);
  }

  // Call this method when products are created/updated/deleted
  async onProductChange(vendorId: string): Promise<void> {
    await this.invalidateInventoryCache(vendorId);
  }
}

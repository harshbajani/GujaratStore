"use client";
import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ResponsiveContainer,
} from "recharts";
import {
  Wallet,
  ShoppingCart,
  Package,
  TrendingUp,
  AlertTriangle,
  Archive,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Loader from "@/components/Loader";

const DashboardCard: React.FC<IDashboardCardProps> = ({
  title,
  value,
  icon,
  trend,
  trendDirection,
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {trend !== undefined && (
        <p
          className={`text-xs ${
            trendDirection === "up" ? "text-green-500" : "text-red-500"
          }`}
        >
          {trendDirection === "up" ? "+" : "-"}
          {trend?.toFixed(2)}% from last month
        </p>
      )}
    </CardContent>
  </Card>
);

const DashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [salesSummary, setSalesSummary] = useState<ISalesSummary | null>(null);
  const [orderStatusBreakdown, setOrderStatusBreakdown] =
    useState<IOrderStatusBreakdown | null>(null);
  const [productInventoryStats, setProductInventoryStats] =
    useState<IProductInventoryStats | null>(null);

  // State for month and year selection
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const fetchDashboardData = async (month?: number, year?: number) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (month !== undefined) queryParams.append("month", month.toString());
      if (year !== undefined) queryParams.append("year", year.toString());

      const response = await fetch(`/api/admin/dashboard?${queryParams}`);
      const result = await response.json();

      if (result.success) {
        setSalesSummary(result.data.salesSummary);
        setOrderStatusBreakdown(result.data.orderStatusBreakdown);
        setProductInventoryStats(result.data.productInventoryStats);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear]);

  if (loading) return <Loader />;

  const monthlyRevenueData = salesSummary
    ? Object.entries(salesSummary.monthlyRevenue)
        .map(([month, revenue]) => ({
          month,
          revenue,
        }))
        // Sort months in chronological order
        .sort((a, b) => {
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
          return months.indexOf(a.month) - months.indexOf(b.month);
        })
    : [];

  const yearlyRevenueData = salesSummary
    ? Object.entries(salesSummary.yearlyRevenue)
        .sort(([yearA], [yearB]) => Number(yearA) - Number(yearB)) // Sort by year
        .map(([year, revenue]) => ({
          year: parseInt(year),
          revenue,
        }))
    : [];

  const orderStatusData = orderStatusBreakdown
    ? Object.entries(orderStatusBreakdown).map(([status, count]) => ({
        status,
        count,
      }))
    : [];

  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884D8",
    "#FF6384",
  ];

  return (
    <div className="p-4 space-y-6">
      {/* Month and Year Selection */}
      <div className="flex gap-4 items-center mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">
            Month
          </label>
          <Select
            value={selectedMonth.toString()}
            onValueChange={(value) => setSelectedMonth(Number(value))}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {[
                "January",
                "February",
                "March",
                "April",
                "May",
                "June",
                "July",
                "August",
                "September",
                "October",
                "November",
                "December",
              ].map((month, index) => (
                <SelectItem key={index} value={index.toString()}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">
            Year
          </label>
          <Select
            value={selectedYear.toString()}
            onValueChange={(value) => setSelectedYear(Number(value))}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {Array.from(
                { length: 10 },
                (_, i) => new Date().getFullYear() - i
              ).map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Existing dashboard cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DashboardCard
          title="Total Revenue"
          value={`₹${salesSummary?.totalRevenue.toFixed(2) || "0.00"}`}
          icon={<Wallet className="h-4 w-4 text-muted-foreground" />}
          trend={Math.abs(salesSummary?.revenueChangePercent || 0)}
          trendDirection={
            salesSummary && salesSummary.revenueChangePercent >= 0
              ? "up"
              : "down"
          }
        />
        <DashboardCard
          title="Total Orders"
          value={salesSummary?.totalOrders.toString() || "0"}
          icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />}
        />
        <DashboardCard
          title="Avg Order Value"
          value={`₹${salesSummary?.averageOrderValue.toFixed(2) || "0.00"}`}
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyRevenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis
                  tickFormatter={(value) =>
                    new Intl.NumberFormat("en-IN", {
                      style: "currency",
                      currency: "INR",
                      notation: "compact",
                      maximumFractionDigits: 1,
                    }).format(value)
                  }
                />
                <Tooltip
                  formatter={(value) => [
                    new Intl.NumberFormat("en-IN", {
                      style: "currency",
                      currency: "INR",
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(Number(value)),
                    "Revenue",
                  ]}
                />
                <Legend />
                <Bar dataKey="revenue" name="Monthly Revenue">
                  {monthlyRevenueData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Last 5 Years Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={yearlyRevenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="year"
                  tickFormatter={(year) => year.toString()}
                />
                <YAxis
                  tickFormatter={(value) =>
                    new Intl.NumberFormat("en-IN", {
                      style: "currency",
                      currency: "INR",
                      notation: "compact",
                      maximumFractionDigits: 1,
                    }).format(value)
                  }
                />
                <Tooltip
                  formatter={(value) => [
                    new Intl.NumberFormat("en-IN", {
                      style: "currency",
                      currency: "INR",
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(Number(value)),
                    "Revenue",
                  ]}
                  labelFormatter={(year) => `Year ${year}`}
                />
                <Legend />
                <Bar dataKey="revenue" fill="#8884d8" name="Annual Revenue">
                  {yearlyRevenueData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Order Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={orderStatusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip formatter={(value) => [value, "Orders"]} />
              <Legend />
              <Bar dataKey="count" name="Order Count">
                {orderStatusData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DashboardCard
          title="Total Products"
          value={productInventoryStats?.totalProducts.toString() || "0"}
          icon={<Package className="h-4 w-4 text-muted-foreground" />}
        />
        <DashboardCard
          title="Low Stock Products"
          value={productInventoryStats?.lowStockProducts.toString() || "0"}
          icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
        />
        <DashboardCard
          title="Inventory Value"
          value={`₹${
            productInventoryStats?.inventoryValueTotal.toFixed(2) || "0.00"
          }`}
          icon={<Archive className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {/* Low Stock Products Section */}
      <Card>
        <CardHeader>
          <CardTitle>Low Stock Products</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Product Name</th>
                <th className="text-right p-2">Current Quantity</th>
              </tr>
            </thead>
            <tbody>
              {productInventoryStats?.lowStockProductDetails?.map((product) => (
                <tr key={product.name} className="border-b hover:bg-gray-50">
                  <td className="p-2 text-wrap max-w-[10px]">{product.name}</td>
                  <td className="p-2 text-right text-red-600">
                    {product.quantity}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top Selling Products</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Product Name</th>
                <th className="text-right p-2">Quantity Sold</th>
                <th className="text-right p-2">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {salesSummary?.topSellingProducts.map((product) => (
                <tr
                  key={product.productId}
                  className="border-b hover:bg-gray-50"
                >
                  <td className="p-2">{product.productName}</td>
                  <td className="p-2 text-right">{product.quantity}</td>
                  <td className="p-2 text-right">
                    ₹{product.revenue.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;

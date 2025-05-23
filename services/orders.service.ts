/* eslint-disable @typescript-eslint/no-explicit-any */
import { CacheService } from "./cache.service";
import Order from "@/lib/models/order.model";
import { getCurrentVendor } from "@/lib/actions/vendor.actions";

const CACHE_KEYS = {
  ORDER_DETAILS: "order:details:",
  ORDER_LIST: "order:list:",
  VENDOR_ORDERS: "order:vendor:",
} as const;

const CACHE_TTL = 300; // 5 minutes

export class OrdersService {
  // Get order by custom orderId (for frontend display)
  static async getOrderByOrderId(
    orderId: string
  ): Promise<ActionResponse<IOrder>> {
    try {
      const cacheKey = `${CACHE_KEYS.ORDER_DETAILS}${orderId}`;
      const cachedOrder = await CacheService.get<IOrder>(cacheKey);

      if (cachedOrder) {
        return { success: true, data: cachedOrder };
      }

      const order = await Order.findOne({ orderId });
      if (!order) {
        return { success: false, message: "Order not found" };
      }

      await CacheService.set(cacheKey, order, CACHE_TTL);
      return { success: true, data: order };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to fetch order",
      };
    }
  }

  // Get order by MongoDB _id (for CRUD operations)
  static async getOrderById(id: string): Promise<ActionResponse<IOrder>> {
    try {
      const cacheKey = `${CACHE_KEYS.ORDER_DETAILS}${id}`;
      const cachedOrder = await CacheService.get<IOrder>(cacheKey);

      if (cachedOrder) {
        return { success: true, data: cachedOrder };
      }

      const order = await Order.findById(id);
      if (!order) {
        return { success: false, message: "Order not found" };
      }

      await CacheService.set(cacheKey, order, CACHE_TTL);
      return { success: true, data: order };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to fetch order",
      };
    }
  }

  // Get orders list with filtering
  static async getOrders(params: {
    userId?: string;
    status?: string;
  }): Promise<ActionResponse<IOrder[]>> {
    try {
      const cacheKey = `${CACHE_KEYS.ORDER_LIST}${JSON.stringify(params)}`;
      const cachedData = await CacheService.get<IOrder[]>(cacheKey);

      if (cachedData) {
        return { success: true, data: cachedData };
      }

      const vendorResponse = await getCurrentVendor();
      const query = await this.buildOrderQuery(vendorResponse, params);

      const orders = await Order.find(query)
        .sort({ createdAt: -1 })
        .populate("items.productId", "productName")
        .lean();

      await CacheService.set(cacheKey, orders, CACHE_TTL);
      return { success: true, data: orders };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to fetch orders",
      };
    }
  }

  static async updateOrderStatus(
    id: string,
    status: string
  ): Promise<ActionResponse> {
    try {
      const validStatus = this.validateOrderStatus(status);
      if (!validStatus.success) {
        return validStatus;
      }

      const updatedOrder = await Order.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      );

      if (!updatedOrder) {
        return { success: false, message: "Order not found" };
      }

      await this.invalidateOrderCaches();
      return {
        success: true,
        message: "Order status updated successfully",
        data: updatedOrder,
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to update order status",
      };
    }
  }

  static async deleteOrder(id: string): Promise<ActionResponse> {
    try {
      const order = await Order.findById(id);
      if (!order) {
        return { success: false, message: "Order not found" };
      }

      await Order.findByIdAndDelete(id);
      await this.invalidateOrderCaches();
      return { success: true, message: "Order deleted successfully" };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to delete order",
      };
    }
  }

  private static validateOrderStatus(status: string): ActionResponse {
    const validStatuses = [
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "returned",
    ];

    if (!status || !validStatuses.includes(status)) {
      return { success: false, message: "Invalid order status" };
    }

    return { success: true };
  }

  private static async buildOrderQuery(
    vendorResponse: any,
    params: {
      userId?: string;
      status?: string;
    }
  ): Promise<any> {
    const query: any = {};

    if (vendorResponse.success && vendorResponse.data?._id) {
      query["items.vendorId"] = vendorResponse.data._id;
    } else if (params.userId) {
      query.userId = params.userId;
    }

    if (params.status) {
      query.status = params.status;
    }

    return query;
  }

  private static async invalidateOrderCaches(): Promise<void> {
    const patterns = Object.values(CACHE_KEYS).map((key) => `${key}*`);
    for (const pattern of patterns) {
      const keys = await CacheService.keys(pattern);
      for (const key of keys) {
        await CacheService.delete(key);
      }
    }
  }
}

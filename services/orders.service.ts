/* eslint-disable @typescript-eslint/no-explicit-any */
import { CacheService } from "./cache.service";
import Order from "@/lib/models/order.model";
import { getCurrentVendor } from "@/lib/actions/vendor.actions";
import Product from "@/lib/models/product.model";
import { connectToDB } from "@/lib/mongodb";
import User from "@/lib/models/user.model";

const CACHE_KEYS = {
  ORDER_DETAILS: "order:details:",
  ORDER_LIST: "order:list:",
  VENDOR_ORDERS: "order:vendor:",
} as const;

const CACHE_TTL = 300; // 5 minutes

export class OrdersService {
  static async createOrder(
    orderData: Partial<IOrder>
  ): Promise<ActionResponse<IOrder>> {
    try {
      await connectToDB();

      // Validate required fields
      if (!this.validateOrderData(orderData)) {
        return { success: false, message: "Missing required fields" };
      }

      const items = orderData.items!;

      // Validate product stock
      const stockValidation = await this.validateProductStock(items);
      if (!stockValidation.success) {
        return {
          success: false,
          message: stockValidation.error || "Stock validation failed",
        };
      }

      // Create order
      const newOrder = new Order(orderData);
      await newOrder.save();

      // Update product quantities
      await this.updateProductQuantities(items);

      // Update user cart and orders
      await this.updateUserData(orderData.userId as string, newOrder._id);

      // Invalidate relevant caches
      await this.invalidateOrderCaches();

      return {
        success: true,
        message: "Order created successfully",
        data: newOrder,
      };
    } catch (error) {
      console.error("Create order error:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to create order",
      };
    }
  }
  // Get order by custom orderId (for frontend display)
  static async getOrderByOrderId(
    orderId: string
  ): Promise<ActionResponse<IOrder>> {
    try {
      const cacheKey = `${CACHE_KEYS.ORDER_DETAILS}${orderId}`;
      const cachedOrder = await CacheService.get<IOrder>(cacheKey);

      if (cachedOrder) {
        return {
          success: true,
          data: cachedOrder,
          message: "Order fetched from cache",
        };
      }

      const order = await Order.findOne({ orderId });
      if (!order) {
        return { success: false, message: "Order not found" };
      }

      await CacheService.set(cacheKey, order, CACHE_TTL);
      return {
        success: true,
        data: order,
        message: "Order fetched successfully",
      };
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
        return {
          success: true,
          data: cachedOrder,
          message: "Order fetched from cache",
        };
      }

      const order = await Order.findById(id);
      if (!order) {
        return { success: false, message: "Order not found" };
      }

      await CacheService.set(cacheKey, order, CACHE_TTL);
      return {
        success: true,
        data: order,
        message: "Order fetched successfully",
      };
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
        return {
          success: true,
          data: cachedData,
          message: "Orders fetched from cache",
        };
      }

      const vendorResponse = await getCurrentVendor();
      const query = await this.buildOrderQuery(vendorResponse, params);

      const orders = await Order.find(query)
        .sort({ createdAt: -1 })
        .populate("items.productId", "productName")
        .lean<IOrder[]>();

      await CacheService.set(cacheKey, orders, CACHE_TTL);
      return {
        success: true,
        data: orders,
        message: "Orders fetched successfully",
      };
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

    return { success: true, message: "Valid order status" };
  }

  private static validateOrderData(orderData: Partial<IOrder>): boolean {
    return !!(
      orderData.orderId &&
      orderData.userId &&
      orderData.items?.length &&
      orderData.subtotal &&
      orderData.total &&
      orderData.addressId &&
      orderData.paymentOption
    );
  }

  private static async validateProductStock(
    items: OrderItem[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      for (const item of items) {
        const product = await Product.findById(item.productId);

        if (!product) {
          return {
            success: false,
            error: `Product not found: ${item.productId}`,
          };
        }

        if (
          !product.productQuantity ||
          product.productQuantity < item.quantity
        ) {
          return {
            success: false,
            error: `Product "${item.productName}" is out of stock or only ${product.productQuantity} available.`,
          };
        }
      }
      return { success: true };
    } catch (error) {
      console.error("Validate stock error:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to validate product stock",
      };
    }
  }

  private static async updateProductQuantities(
    items: OrderItem[]
  ): Promise<void> {
    try {
      const updates = items.map((item) =>
        Product.findByIdAndUpdate(
          item.productId,
          { $inc: { productQuantity: -item.quantity } },
          { new: true }
        )
      );
      await Promise.all(updates);
    } catch (error) {
      console.error("Update quantities error:", error);
      throw new Error(
        `Failed to update product quantities: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private static async updateUserData(
    userId: string,
    orderId: string
  ): Promise<void> {
    try {
      await User.findByIdAndUpdate(
        userId,
        {
          $push: { order: orderId },
          $set: { cart: [] },
        },
        { new: true }
      );
    } catch (error) {
      console.error("Update user data error:", error);
      throw new Error(
        `Failed to update user data: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
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

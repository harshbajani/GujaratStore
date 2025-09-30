/* eslint-disable @typescript-eslint/no-explicit-any */
import { CacheService } from "./cache.service";
import Order from "@/lib/models/order.model";
import { getCurrentVendor } from "@/lib/actions/vendor.actions";
import Product from "@/lib/models/product.model";
import { connectToDB } from "@/lib/mongodb";
import User from "@/lib/models/user.model";

interface IOrder {
  _id: string;
  orderId: string;
  status: string;
  userId: string;
  items: IOrderItem[];
  subtotal: number;
  deliveryCharges: number;
  total: number;
  addressId: string;
  paymentOption: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

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

      // Check if order already exists first
      const existingOrder = await Order.findOne({ orderId: orderData.orderId });
      if (existingOrder) {
        console.log(
          `Order ${orderData.orderId} already exists, returning existing order`
        );
        return {
          success: true,
          message: "Order already exists",
          data: existingOrder,
        };
      }

      // Handle potential duplicate orderId with retry mechanism
      return await this.createOrderWithRetry(orderData, items);
    } catch (error) {
      console.error("Create order error:", error);

      // Provide more specific error messages based on the error type
      let errorMessage = "Failed to create order";

      if (error instanceof Error) {
        if (error.message.includes("Order validation failed")) {
          // Extract specific validation errors from MongoDB
          if (
            error.message.includes("vendorId") &&
            error.message.includes("required")
          ) {
            errorMessage =
              "Product vendor information is missing. Please refresh and try again.";
          } else if (
            error.message.includes("selectedSize") &&
            error.message.includes("Cast to string failed")
          ) {
            errorMessage =
              "Size selection format is invalid. Please reselect sizes and try again.";
          } else {
            errorMessage =
              "Order information is incomplete. Please check all fields and try again.";
          }
        } else if (
          error.message.includes("stock") ||
          error.message.includes("quantity")
        ) {
          errorMessage =
            "Some products are out of stock. Please check your cart.";
        } else {
          errorMessage = error.message;
        }
      }

      return {
        success: false,
        message: errorMessage,
      };
    }
  }

  // Helper method to handle order creation with retry logic for duplicate orderIds
  private static async createOrderWithRetry(
    orderData: Partial<IOrder>,
    items: IOrderItem[],
    maxRetries: number = 3
  ): Promise<ActionResponse<IOrder>> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Check if this is a retry due to duplicate orderId
        if (attempt > 1) {
          // Generate a new orderId for retry attempts
          const { generateUniqueOrderId } = await import("@/lib/utils");
          orderData.orderId = generateUniqueOrderId();
          console.log(
            `Retry attempt ${attempt} with new orderId: ${orderData.orderId}`
          );
        }

        // Check if an order with this orderId already exists
        const existingOrder = await Order.findOne({
          orderId: orderData.orderId,
        });
        if (existingOrder) {
          if (attempt < maxRetries) {
            console.log(
              `Order with ID ${orderData.orderId} already exists, generating new ID...`
            );
            continue; // This will trigger a retry with a new orderId
          } else {
            throw new Error(`Duplicate orderId after ${maxRetries} attempts`);
          }
        }

        // Create order
        const newOrder = new Order(orderData);
        await newOrder.save();

        // Update product quantities
        await this.updateProductQuantities(items);

        // Update user cart and orders - only clear cart for processing orders (completed orders)
        const shouldClearCart =
          orderData.status === "processing" ||
          orderData.paymentOption === "cash-on-delivery";
        await this.updateUserData(
          orderData.userId as string,
          newOrder._id,
          shouldClearCart
        );

        // Also invalidate user caches so profile/cart reflect immediately
        try {
          const userKeys = await CacheService.keys("users:*");
          await Promise.all(userKeys.map((key) => CacheService.delete(key)));
        } catch (e) {
          console.error("Failed to invalidate user cache after order", e);
        }

        // Invalidate relevant caches
        await this.invalidateOrderCaches();

        return {
          success: true,
          message: "Order created successfully",
          data: newOrder,
        };
      } catch (error: any) {
        // Check if this is a duplicate key error
        if (
          error.code === 11000 &&
          error.keyPattern?.orderId &&
          attempt < maxRetries
        ) {
          console.log(
            `Duplicate orderId detected on attempt ${attempt}, retrying...`
          );
          continue; // Retry with a new orderId
        }

        // If it's not a duplicate error or we've exhausted retries, throw the error
        throw error;
      }
    }

    // If we get here, all retries failed
    return {
      success: false,
      message:
        "Failed to create order after multiple attempts. Please try again.",
    };
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

  // Get order by MongoDB _id with populated product data (for shipping operations)
  static async getOrderByIdWithProducts(id: string): Promise<ActionResponse<IOrder>> {
    try {
      // Don't use cache for this method since we need fresh product data
      await connectToDB();
      
      const order = await Order.findById(id).populate({
        path: 'items.productId',
        model: Product,
        select: 'productName deadWeight appliedWeight volumetricWeight dimensions'
      });
      
      if (!order) {
        return { success: false, message: "Order not found" };
      }

      // Simply return the order with populated product data - no complex transformation needed
      const orderData = order.toObject();
      
      console.log('[OrdersService] Order items with product data:', 
        orderData.items.map((item: any, index: number) => ({
          index,
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
          productPopulated: typeof item.productId === 'object',
          productWeight: typeof item.productId === 'object' ? item.productId.appliedWeight || item.productId.deadWeight : 'Not populated',
          productDims: typeof item.productId === 'object' && item.productId.dimensions ? 
            `${item.productId.dimensions.length}x${item.productId.dimensions.width}x${item.productId.dimensions.height}` : 'Not populated'
        }))
      );

      return {
        success: true,
        data: orderData,
        message: "Order fetched with product data successfully",
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to fetch order with products",
      };
    }
  }

  static async getAdminOrdersPaginated(
    params: PaginationParams & {
      userId?: string;
      status?: string;
      vendorId?: string;
      dateFrom?: string;
      dateTo?: string;
    } = {}
  ): Promise<PaginatedResponse<IOrder>> {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        sortBy = "createdAt",
        sortOrder = "desc",
        userId,
        status,
        vendorId,
        dateFrom,
        dateTo,
      } = params;

      // Create cache key based on all parameters
      const cacheKey = `${
        CACHE_KEYS.ORDER_LIST
      }:admin:paginated:${JSON.stringify({
        page,
        limit,
        search,
        sortBy,
        sortOrder,
        userId,
        status,
        vendorId,
        dateFrom,
        dateTo,
      })}`;

      const cached = await CacheService.get<PaginatedResponse<IOrder>>(
        cacheKey
      );
      if (cached) {
        return cached;
      }

      // Build query object for admin (no vendor restrictions)
      const query: any = {};

      // Apply filters if provided
      if (userId) query.userId = userId;
      if (status) query.status = status;
      if (vendorId) query["items.vendorId"] = vendorId;

      // Add date range filter
      if (dateFrom || dateTo) {
        query.createdAt = {};
        if (dateFrom) {
          query.createdAt.$gte = new Date(dateFrom);
        }
        if (dateTo) {
          query.createdAt.$lte = new Date(dateTo);
        }
      }

      // Add search functionality
      if (search) {
        query.$or = [
          { orderNumber: { $regex: search, $options: "i" } },
          { "customerDetails.name": { $regex: search, $options: "i" } },
          { "customerDetails.email": { $regex: search, $options: "i" } },
          { "customerDetails.phone": { $regex: search, $options: "i" } },
          { status: { $regex: search, $options: "i" } },
          { "items.productName": { $regex: search, $options: "i" } },
        ];
      }

      // Build sort object
      const sort: any = {};
      sort[sortBy] = sortOrder === "desc" ? -1 : 1;

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute queries in parallel
      const [orders, totalCount] = await Promise.all([
        Order.find(query)
          .populate("items.productId", "productName")
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean<IOrder[]>(),
        Order.countDocuments(query),
      ]);

      const totalPages = Math.ceil(totalCount / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      const result: PaginatedResponse<IOrder> = {
        success: true,
        data: orders,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: totalCount,
          itemsPerPage: limit,
          hasNext,
          hasPrev,
        },
      };

      // Cache the result
      await CacheService.set(cacheKey, result, CACHE_TTL);

      return result;
    } catch (error) {
      console.error("Get admin orders paginated error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch orders",
      };
    }
  }

  static async getOrdersPaginated(
    params: PaginationParams = {},
    vendorId?: string,
    userId?: string
  ): Promise<PaginatedResponse<IOrder>> {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        sortBy = "createdAt",
        sortOrder = "desc",
      } = params;

      // Create cache key based on all parameters
      const cacheKey = `${CACHE_KEYS.ORDER_LIST}:paginated:${
        vendorId || userId || "all"
      }:${page}:${limit}:${search}:${sortBy}:${sortOrder}`;

      const cached = await CacheService.get<PaginatedResponse<IOrder>>(
        cacheKey
      );
      if (cached) {
        return cached;
      }

      // Build base query
      const vendorResponse = await getCurrentVendor();
      const query = await this.buildOrderQuery(vendorResponse, {
        userId: undefined,
        status: undefined,
      });

      // Add vendor filter if provided (for admin endpoints)
      if (vendorId) {
        query["items.vendorId"] = vendorId;
      }

      // Add search functionality
      if (search) {
        query.$or = [
          { orderNumber: { $regex: search, $options: "i" } },
          { "customerDetails.name": { $regex: search, $options: "i" } },
          { "customerDetails.email": { $regex: search, $options: "i" } },
          { "customerDetails.phone": { $regex: search, $options: "i" } },
          { status: { $regex: search, $options: "i" } },
          { "items.productName": { $regex: search, $options: "i" } },
        ];
      }

      // Build sort object
      const sort: any = {};
      sort[sortBy] = sortOrder === "desc" ? -1 : 1;

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute queries in parallel
      const [orders, totalCount] = await Promise.all([
        Order.find(query)
          .populate("items.productId", "productName")
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean<IOrder[]>(),
        Order.countDocuments(query),
      ]);

      const totalPages = Math.ceil(totalCount / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      const result: PaginatedResponse<IOrder> = {
        success: true,
        data: orders,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: totalCount,
          itemsPerPage: limit,
          hasNext,
          hasPrev,
        },
      };

      // Cache the result
      await CacheService.set(cacheKey, result, CACHE_TTL);

      return result;
    } catch (error) {
      console.error("Get orders paginated error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch orders",
      };
    }
  }

  // Enhanced method with filtering support
  static async getOrdersPaginatedWithFilters(
    params: PaginationParams & {
      userId?: string;
      status?: string;
      vendorId?: string;
      dateFrom?: string;
      dateTo?: string;
    } = {}
  ): Promise<PaginatedResponse<IOrder>> {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        sortBy = "createdAt",
        sortOrder = "desc",
        userId,
        status,
        vendorId,
        dateFrom,
        dateTo,
      } = params;

      // Create cache key based on all parameters
      const cacheKey = `${CACHE_KEYS.ORDER_LIST}:paginated:${JSON.stringify({
        page,
        limit,
        search,
        sortBy,
        sortOrder,
        userId,
        status,
        vendorId,
        dateFrom,
        dateTo,
      })}`;

      const cached = await CacheService.get<PaginatedResponse<IOrder>>(
        cacheKey
      );
      if (cached) {
        return cached;
      }

      let matchingUserIds = [];
      if (search) {
        matchingUserIds = await User.find({
          name: { $regex: search, $options: "i" },
        }).distinct("_id");
      }

      // Build base query
      const vendorResponse = await getCurrentVendor();
      const query = await this.buildOrderQuery(vendorResponse, {
        userId,
        status,
      });
      if (dateFrom || dateTo) {
        query.createdAt = {};
        if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
        if (dateTo) query.createdAt.$lte = new Date(dateTo);
      }
      if (vendorId) {
        query["items.vendorId"] = vendorId;
      }

      // Add date range filter
      if (dateFrom || dateTo) {
        query.createdAt = {};
        if (dateFrom) {
          query.createdAt.$gte = new Date(dateFrom);
        }
        if (dateTo) {
          query.createdAt.$lte = new Date(dateTo);
        }
      }

      // Add search functionality
      if (search) {
        query.$or = [
          { orderId: { $regex: search, $options: "i" } },
          { "customerDetails.name": { $regex: search, $options: "i" } },
          { "customerDetails.email": { $regex: search, $options: "i" } },
          { "customerDetails.phone": { $regex: search, $options: "i" } },
          { status: { $regex: search, $options: "i" } },
          { "items.productName": { $regex: search, $options: "i" } },
        ];
        if (matchingUserIds.length) {
          query.$or.push({ userId: { $in: matchingUserIds } });
        }
      }

      // Build sort object
      const sort: any = {};
      sort[sortBy] = sortOrder === "desc" ? -1 : 1;

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute queries in parallel
      const [orders, totalCount] = await Promise.all([
        Order.find(query)
          .populate("items.productId", "productName")
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean<IOrder[]>(),
        Order.countDocuments(query),
      ]);

      const totalPages = Math.ceil(totalCount / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      const result: PaginatedResponse<IOrder> = {
        success: true,
        data: orders,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: totalCount,
          itemsPerPage: limit,
          hasNext,
          hasPrev,
        },
      };

      // Cache the result
      await CacheService.set(cacheKey, result, CACHE_TTL);

      return result;
    } catch (error) {
      console.error("Get orders paginated with filters error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch orders",
      };
    }
  }

  // Get orders list with filtering
  static async getOrdersLegacy(params: {
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

  static async updateOrderByOrderId(
    orderId: string,
    updateData: any
  ): Promise<ActionResponse> {
    try {
      // Validate status if provided
      if (updateData.status) {
        const validStatus = this.validateOrderStatus(updateData.status);
        if (!validStatus.success) {
          return validStatus;
        }
      }

      const updatedOrder = await Order.findOneAndUpdate(
        { orderId },
        updateData,
        { new: true }
      );

      if (!updatedOrder) {
        return { success: false, message: "Order not found" };
      }

      await this.invalidateOrderCaches();
      return {
        success: true,
        message: "Order updated successfully",
        data: updatedOrder,
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to update order",
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
      "unconfirmed",
      "processing",
      "ready to ship",
      "shipped",
      "out for delivery",
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
    items: IOrderItem[]
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
    items: IOrderItem[]
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
    orderId: string,
    clearCart: boolean = true
  ): Promise<void> {
    try {
      const updateData: any = {
        $push: { order: orderId },
      };

      // Only clear cart if specified (for confirmed orders or COD)
      if (clearCart) {
        updateData.$set = { cart: [] };
      }

      await User.findByIdAndUpdate(userId, updateData, { new: true });
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

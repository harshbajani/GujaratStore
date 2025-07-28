/* eslint-disable @typescript-eslint/no-explicit-any */
import User from "@/lib/models/user.model";
import Order from "@/lib/models/order.model";
import { CacheService } from "./cache.service";
import { Types } from "mongoose";
import { getCurrentVendor } from "@/lib/actions/vendor.actions";

export class UserService {
  private static CACHE_TTL = 86400; // 24 hours

  private static async getCacheKey(key: string): Promise<string> {
    return `users:${key}`;
  }

  private static transformUser(user: any): UserResponse {
    const { ...safeUser } = user;

    return {
      ...safeUser,
      _id: safeUser._id.toString(),
      wishlist: safeUser.wishlist?.map((id: any) => id.toString()) || [],
      cart: safeUser.cart?.map((id: any) => id.toString()) || [],
      order: safeUser.order?.map((id: any) => id.toString()) || [],
    };
  }

  static async createUser(
    data: Partial<IUser>
  ): Promise<ActionResponse<UserResponse>> {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email: data.email }, { phone: data.phone }],
      });

      if (existingUser) {
        return {
          success: false,
          message: "User with this email or phone already exists",
        };
      }

      const user = await User.create(data);
      await this.invalidateCache();

      return {
        success: true,
        message: "User created successfully",
        data: this.transformUser(user),
      };
    } catch (error) {
      console.error("Create user error:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to create user",
      };
    }
  }

  static async getAllUsers(
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<UserResponse>> {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        sortBy = "name",
        sortOrder = "asc",
      } = params;

      // Create cache key based on all parameters
      const cacheKey = await this.getCacheKey(
        `paginated:${page}:${limit}:${search}:${sortBy}:${sortOrder}`
      );

      const cached = await CacheService.get<PaginatedResponse<UserResponse>>(
        cacheKey
      );
      if (cached) {
        return cached;
      }

      // Build query for search
      const query: any = {};
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
        ];
      }

      // Build sort object
      const sort: any = {};
      sort[sortBy] = sortOrder === "desc" ? -1 : 1;

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute queries in parallel
      const [users, totalCount] = await Promise.all([
        User.find(query)
          .select("-password -verificationToken -verificationTokenExpiry")
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        User.countDocuments(query),
      ]);

      // Transform users
      const transformedUsers: UserResponse[] = users.map((user) =>
        this.transformUser(user)
      );

      const totalPages = Math.ceil(totalCount / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      const result: PaginatedResponse<UserResponse> = {
        success: true,
        data: transformedUsers,
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
      await CacheService.set(cacheKey, result, this.CACHE_TTL);

      return result;
    } catch (error) {
      console.error("Get users error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch users",
      };
    }
  }

  static async getCustomersWithOrders(params: PaginationParams = {}): Promise<
    PaginatedResponse<
      UserResponse & {
        orderCount: number;
        totalSpent: number;
        lastOrderDate: string;
        firstOrderDate: string;
      }
    >
  > {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        sortBy = "name",
        sortOrder = "asc",
      } = params;

      // Get current vendor
      const vendorResponse = await getCurrentVendor();

      if (!vendorResponse.success || !vendorResponse.data?._id) {
        return { success: false, error: "Vendor not authenticated" };
      }

      const vendorId = new Types.ObjectId(vendorResponse.data._id);

      // Build the aggregation pipeline
      const pipeline: any[] = [
        // Step 1: Unwind items to process each item individually
        { $unwind: "$items" },

        // Step 2: Lookup product details for each item
        {
          $lookup: {
            from: "products",
            localField: "items.productId",
            foreignField: "_id",
            as: "product",
          },
        },

        // Step 3: Unwind product (should be single product per item)
        { $unwind: "$product" },

        // Step 4: CRITICAL - Filter by vendor BEFORE grouping
        {
          $match: {
            "product.vendorId": vendorId,
          },
        },

        // Step 5: Group by user to get order statistics
        {
          $group: {
            _id: "$userId",
            orderCount: { $sum: 1 }, // Count of items from this vendor
            totalSpent: { $sum: "$items.price" }, // Sum of item prices, not order total
            lastOrderDate: { $max: "$createdAt" },
            firstOrderDate: { $min: "$createdAt" },
            orderIds: { $addToSet: "$_id" }, // Collect unique order IDs
          },
        },

        // Step 6: Add actual order count (distinct orders, not items)
        {
          $addFields: {
            actualOrderCount: { $size: "$orderIds" },
          },
        },

        // Step 7: Lookup user details
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user",
          },
        },

        // Step 8: Unwind user (should be single user)
        { $unwind: "$user" },

        // Step 9: Project the final structure
        {
          $project: {
            _id: "$user._id",
            name: "$user.name",
            email: "$user.email",
            phone: "$user.phone",
            addresses: "$user.addresses",
            referral: "$user.referral",
            rewardPoints: "$user.rewardPoints",
            referralUsed: "$user.referralUsed",
            role: "$user.role",
            isVerified: "$user.isVerified",
            wishlist: "$user.wishlist",
            cart: "$user.cart",
            order: "$user.order",
            __v: "$user.__v",
            orderCount: "$actualOrderCount", // Use actual order count
            totalSpent: 1,
            lastOrderDate: 1,
            firstOrderDate: 1,
          },
        },
      ];

      // Add search filter if provided (BEFORE sorting and pagination)
      if (search) {
        pipeline.push({
          $match: {
            $or: [
              { name: { $regex: search, $options: "i" } },
              { email: { $regex: search, $options: "i" } },
              { phone: { $regex: search, $options: "i" } },
            ],
          },
        });
      }
      // Calculate total count before pagination
      const countPipeline = [...pipeline, { $count: "total" }];
      const [countResult] = await Order.aggregate(countPipeline);
      const totalCount = countResult?.total || 0;

      // Add sort
      const sortStage: any = {};
      sortStage[sortBy] = sortOrder === "desc" ? -1 : 1;
      pipeline.push({ $sort: sortStage });

      // Add pagination
      const skip = (page - 1) * limit;
      pipeline.push({ $skip: skip });
      pipeline.push({ $limit: limit });

      // Execute aggregation
      const customers = await Order.aggregate(pipeline);

      // Transform customers
      const transformedCustomers = customers.map((customer) => ({
        ...this.transformUser(customer),
        orderCount: customer.orderCount,
        totalSpent: customer.totalSpent,
        lastOrderDate: customer.lastOrderDate,
        firstOrderDate: customer.firstOrderDate,
      }));

      const totalPages = Math.ceil(totalCount / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      const result: PaginatedResponse<
        UserResponse & {
          orderCount: number;
          totalSpent: number;
          lastOrderDate: string;
          firstOrderDate: string;
        }
      > = {
        success: true,
        data: transformedCustomers,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: totalCount,
          itemsPerPage: limit,
          hasNext,
          hasPrev,
        },
      };

      return result;
    } catch (error) {
      console.error("Get customers with orders error:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch customers with orders",
      };
    }
  }

  static async getCustomersWithOrdersForAdmin(
    params: PaginationParams = {}
  ): Promise<
    PaginatedResponse<
      UserResponse & {
        orderCount: number;
        totalSpent: number;
        lastOrderDate: string;
        firstOrderDate: string;
        products: string[];
      }
    >
  > {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        sortBy = "name",
        sortOrder = "asc",
      } = params;

      // Build aggregation pipeline
      const pipeline: any[] = [
        // 1) Unwind each item in every order
        { $unwind: "$items" },

        // 2) Lookup product details so we can collect names
        {
          $lookup: {
            from: "products",
            localField: "items.productId",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: "$product" },

        {
          $group: {
            _id: "$userId",
            orderIds: { $addToSet: "$_id" },
            totalSpent: { $sum: "$items.price" },
            lastOrderDate: { $max: "$createdAt" },
            firstOrderDate: { $min: "$createdAt" },
            products: { $addToSet: "$product.productName" },
          },
        },

        // 4) Add the actual count of orders
        {
          $addFields: {
            orderCount: { $size: "$orderIds" },
          },
        },

        // 5) Lookup the user document
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },

        // 6) Project the shape we want in the result
        {
          $project: {
            _id: "$user._id",
            name: "$user.name",
            email: "$user.email",
            phone: "$user.phone",
            addresses: "$user.addresses",
            referral: "$user.referral",
            rewardPoints: "$user.rewardPoints",
            referralUsed: "$user.referralUsed",
            role: "$user.role",
            isVerified: "$user.isVerified",
            wishlist: "$user.wishlist",
            cart: "$user.cart",
            order: "$user.order",
            __v: "$user.__v",

            orderCount: 1,
            totalSpent: 1,
            lastOrderDate: 1,
            firstOrderDate: 1,
            products: 1,
          },
        },
      ];

      // 7) Apply search filter on name/email/phone if provided
      if (search) {
        pipeline.push({
          $match: {
            $or: [
              { name: { $regex: search, $options: "i" } },
              { email: { $regex: search, $options: "i" } },
              { phone: { $regex: search, $options: "i" } },
            ],
          },
        });
      }

      // 8) Count total after filters
      const countPipeline = [...pipeline, { $count: "total" }];
      const [countResult] = await Order.aggregate(countPipeline);
      const totalItems = countResult?.total || 0;

      // 9) Sort
      const sortStage: any = {};
      sortStage[sortBy] = sortOrder === "desc" ? -1 : 1;
      pipeline.push({ $sort: sortStage });

      // 10) Paginate
      const skip = (page - 1) * limit;
      pipeline.push({ $skip: skip }, { $limit: limit });

      // 11) Execute and transform
      const raw = await Order.aggregate(pipeline);
      const customers = raw.map((c) => ({
        ...c,
        lastOrderDate: c.lastOrderDate.toISOString(),
        firstOrderDate: c.firstOrderDate.toISOString(),
      }));

      return {
        success: true,
        data: customers,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalItems / limit),
          totalItems,
          itemsPerPage: limit,
          hasNext: page * limit < totalItems,
          hasPrev: page > 1,
        },
      };
    } catch (err) {
      console.error("AdminService.getCustomersWithOrders", err);
      return {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : "Failed to fetch customers with orders",
      };
    }
  }

  static async getAllUsersLegacy(): Promise<ActionResponse<UserResponse[]>> {
    try {
      const cacheKey = await this.getCacheKey("all");
      const cached = await CacheService.get<UserResponse[]>(cacheKey);

      if (cached) {
        return {
          success: true,
          message: "Users fetched successfully",
          data: cached,
        };
      }

      const users = await User.find({})
        .select("-password -verificationToken -verificationTokenExpiry")
        .sort({ createdAt: -1 })
        .lean();

      const transformedUsers: UserResponse[] = users.map((user) =>
        this.transformUser(user)
      );

      await CacheService.set(cacheKey, transformedUsers, this.CACHE_TTL);

      return {
        success: true,
        message: "Users fetched successfully",
        data: transformedUsers,
      };
    } catch (error) {
      console.error("Get users error:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to fetch users",
      };
    }
  }

  static async getUserById(id: string): Promise<ActionResponse<UserResponse>> {
    try {
      const cacheKey = await this.getCacheKey(id);
      const cached = await CacheService.get<UserResponse>(cacheKey);

      if (cached) {
        return {
          success: true,
          message: "User fetched successfully",
          data: cached,
        };
      }

      if (!Types.ObjectId.isValid(id)) {
        return { success: false, message: "Invalid user ID" };
      }

      const user = await User.findById(id)
        .select("-password -verificationToken -verificationTokenExpiry")
        .lean<IUser>();

      if (!user) {
        return { success: false, message: "User not found" };
      }

      const transformedUser = this.transformUser(user);

      await CacheService.set(cacheKey, transformedUser, this.CACHE_TTL);

      return {
        success: true,
        message: "User fetched successfully",
        data: transformedUser,
      };
    } catch (error) {
      console.error("Get user by id error:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to fetch user",
      };
    }
  }

  static async getUserByEmail(
    email: string
  ): Promise<ActionResponse<UserResponse>> {
    try {
      const cacheKey = await this.getCacheKey(`email:${email}`);
      const cached = await CacheService.get<UserResponse>(cacheKey);

      if (cached) {
        return {
          success: true,
          message: "User fetched successfully",
          data: cached,
        };
      }

      const user = await User.findOne({ email })
        .select("-password -verificationToken -verificationTokenExpiry")
        .lean<IUser>();

      if (!user) {
        return { success: false, message: "User not found" };
      }

      const transformedUser = this.transformUser(user);

      await CacheService.set(cacheKey, transformedUser, this.CACHE_TTL);

      return {
        success: true,
        message: "User fetched successfully",
        data: transformedUser,
      };
    } catch (error) {
      console.error("Get user by email error:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to fetch user",
      };
    }
  }

  static async updateUser(
    id: string,
    data: Partial<IUser>
  ): Promise<ActionResponse<UserResponse>> {
    try {
      // Remove sensitive fields from update data
      const { ...updateData } = data;

      // Check for duplicate email or phone if they're being updated
      if (updateData.email || updateData.phone) {
        const query: any = {
          _id: { $ne: id },
          $or: [],
        };

        if (updateData.email) {
          query.$or.push({ email: updateData.email });
        }
        if (updateData.phone) {
          query.$or.push({ phone: updateData.phone });
        }

        const existingUser = await User.findOne(query);
        if (existingUser) {
          return {
            success: false,
            message: "Email or phone number already in use",
          };
        }
      }

      const user = await User.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      )
        .select("-password -verificationToken -verificationTokenExpiry")
        .lean();

      if (!user) {
        return { success: false, message: "User not found" };
      }

      await this.invalidateCache();

      return {
        success: true,
        message: "User updated successfully",
        data: this.transformUser(user),
      };
    } catch (error) {
      console.error("Update user error:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to update user",
      };
    }
  }

  static async deleteUser(id: string): Promise<ActionResponse<UserResponse>> {
    try {
      const user = await User.findByIdAndDelete(id)
        .select("-password -verificationToken -verificationTokenExpiry")
        .lean();

      if (!user) {
        return { success: false, message: "User not found" };
      }

      await this.invalidateCache();

      return {
        success: true,
        message: "User deleted successfully",
        data: this.transformUser(user),
      };
    } catch (error) {
      console.error("Delete user error:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to delete user",
      };
    }
  }
  // Wishlist operations
  static async addToWishlist(
    userId: string,
    productId: string
  ): Promise<ActionResponse<UserResponse>> {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { $addToSet: { wishlist: productId } },
        { new: true }
      )
        .select("-password -verificationToken -verificationTokenExpiry")
        .lean();

      if (!user) {
        return { success: false, message: "User not found" };
      }

      await this.invalidateCache();

      return {
        success: true,
        message: "Added to wishlist successfully",
        data: this.transformUser(user),
      };
    } catch (error) {
      console.error("Add to wishlist error:", error);
      return {
        success: false,
        message: "Failed to add to wishlist",
      };
    }
  }

  static async removeFromWishlist(
    userId: string,
    productId: string
  ): Promise<ActionResponse<UserResponse>> {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { $pull: { wishlist: productId } },
        { new: true }
      )
        .select("-password -verificationToken -verificationTokenExpiry")
        .lean();

      if (!user) {
        return { success: false, message: "User not found" };
      }

      await this.invalidateCache();

      return {
        success: true,
        message: "Removed from wishlist successfully",
        data: this.transformUser(user),
      };
    } catch (error) {
      console.error("Remove from wishlist error:", error);
      return {
        success: false,
        message: "Failed to remove from wishlist",
      };
    }
  }

  // Cart operations
  static async addToCart(
    userId: string,
    productId: string
  ): Promise<ActionResponse<UserResponse>> {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { $addToSet: { cart: productId } },
        { new: true }
      )
        .select("-password -verificationToken -verificationTokenExpiry")
        .lean();

      if (!user) {
        return { success: false, message: "User not found" };
      }

      await this.invalidateCache();

      return {
        success: true,
        message: "Added to cart successfully",
        data: this.transformUser(user),
      };
    } catch (error) {
      console.error("Add to cart error:", error);
      return {
        success: false,
        message: "Failed to add to cart",
      };
    }
  }

  static async removeFromCart(
    userId: string,
    productId: string
  ): Promise<ActionResponse<UserResponse>> {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { $pull: { cart: productId } },
        { new: true }
      )
        .select("-password -verificationToken -verificationTokenExpiry")
        .lean();

      if (!user) {
        return { success: false, message: "User not found" };
      }

      await this.invalidateCache();

      return {
        success: true,
        message: "Removed from cart successfully",
        data: this.transformUser(user),
      };
    } catch (error) {
      console.error("Remove from cart error:", error);
      return {
        success: false,
        message: "Failed to remove from cart",
      };
    }
  }

  // Alias for getCustomersWithOrdersPaginated (calls getCustomersWithOrders)
  static async getCustomersWithOrdersPaginated(
    params: PaginationParams = {}
  ): Promise<
    PaginatedResponse<
      UserResponse & {
        orderCount: number;
        totalSpent: number;
        lastOrderDate: string;
        firstOrderDate: string;
      }
    >
  > {
    // Just call getCustomersWithOrders (already paginated)
    return this.getCustomersWithOrders(params);
  }

  static async getCustomersWithOrdersPaginatedForAdmin(
    params: PaginationParams = {}
  ): Promise<
    PaginatedResponse<
      UserResponse & {
        orderCount: number;
        totalSpent: number;
        lastOrderDate: string;
        firstOrderDate: string;
      }
    >
  > {
    // Just call getCustomersWithOrders (already paginated)
    return this.getCustomersWithOrdersForAdmin(params);
  }

  // Customer stats for dashboard
  static async getCustomerStats(): Promise<
    ActionResponse<{
      totalCustomers: number;
      activeCustomers: number;
      newCustomers: number;
      averageOrderValue: number;
      yearlyNewCustomers: { [year: number]: number };
    }>
  > {
    try {
      // Get all customers with orders (no pagination, get all)
      const customersResult = await this.getCustomersWithOrders({
        page: 1,
        limit: 10000,
      });
      if (!customersResult.success || !customersResult.data) {
        return {
          success: false,
          message: "Failed to fetch customers",
        };
      }
      const customers = customersResult.data;

      // Active customers: last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const activeCustomers = customers.filter(
        (customer) => new Date(customer.lastOrderDate) > thirtyDaysAgo
      ).length;

      // New customers for current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const newCustomers = customers.filter((customer) => {
        const firstOrder = new Date(customer.firstOrderDate);
        return firstOrder >= startOfMonth && firstOrder < endOfMonth;
      }).length;

      // Yearly new customers
      const yearlyNewCustomers = customers.reduce((acc, customer) => {
        const year = new Date(customer.firstOrderDate).getFullYear();
        acc[year] = (acc[year] || 0) + 1;
        return acc;
      }, {} as { [year: number]: number });

      // Average order value
      const totalOrders = customers.reduce(
        (sum, customer) => sum + customer.orderCount,
        0
      );
      const grandTotalSpent = customers.reduce(
        (sum, customer) => sum + customer.totalSpent,
        0
      );
      const averageOrderValue =
        totalOrders > 0 ? grandTotalSpent / totalOrders : 0;

      return {
        success: true,
        message: "Customer stats fetched successfully",
        data: {
          totalCustomers: customers.length,
          activeCustomers,
          newCustomers,
          averageOrderValue,
          yearlyNewCustomers,
        },
      };
    } catch (error) {
      console.error("Get customer stats error:", error);
      return {
        success: false,
        message: "Failed to fetch customer stats",
      };
    }
  }

  // Get new customers for a specific month/year
  static async getNewCustomersForMonth(
    month: number,
    year: number
  ): Promise<ActionResponse<number>> {
    try {
      // Get all customers with orders (no pagination, get all)
      const customersResult = await this.getCustomersWithOrders({
        page: 1,
        limit: 10000,
      });
      if (!customersResult.success || !customersResult.data) {
        return {
          success: false,
          message: "Failed to fetch customers",
        };
      }
      const customers = customersResult.data;
      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 1);
      const newCustomers = customers.filter((customer) => {
        const firstOrder = new Date(customer.firstOrderDate);
        return firstOrder >= startOfMonth && firstOrder < endOfMonth;
      }).length;
      return {
        success: true,
        message: "New customers for month fetched successfully",
        data: newCustomers,
      };
    } catch (error) {
      console.error("Get new customers for month error:", error);
      return {
        success: false,
        message: "Failed to fetch new customers for month",
      };
    }
  }

  // Admin: Get customer stats (all customers with orders, not vendor-specific)
  static async getCustomerStatsForAdmin(): Promise<
    ActionResponse<{
      totalCustomers: number;
      activeCustomers: number;
      newCustomers: number;
      averageOrderValue: number;
      yearlyNewCustomers: { [year: number]: number };
    }>
  > {
    try {
      // Get all customers with orders (no pagination, get all)
      const customersResult = await this.getCustomersWithOrdersForAdmin({
        page: 1,
        limit: 10000,
      });
      if (!customersResult.success || !customersResult.data) {
        return {
          success: false,
          message: "Failed to fetch customers",
        };
      }
      const customers = customersResult.data;

      // Active customers: last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const activeCustomers = customers.filter(
        (customer) => new Date(customer.lastOrderDate) > thirtyDaysAgo
      ).length;

      // New customers for current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const newCustomers = customers.filter((customer) => {
        const firstOrder = new Date(customer.firstOrderDate);
        return firstOrder >= startOfMonth && firstOrder < endOfMonth;
      }).length;

      // Yearly new customers
      const yearlyNewCustomers = customers.reduce((acc, customer) => {
        const year = new Date(customer.firstOrderDate).getFullYear();
        acc[year] = (acc[year] || 0) + 1;
        return acc;
      }, {} as { [year: number]: number });

      // Average order value
      const totalOrders = customers.reduce(
        (sum, customer) => sum + customer.orderCount,
        0
      );
      const grandTotalSpent = customers.reduce(
        (sum, customer) => sum + customer.totalSpent,
        0
      );
      const averageOrderValue =
        totalOrders > 0 ? grandTotalSpent / totalOrders : 0;

      return {
        success: true,
        message: "Customer stats fetched successfully",
        data: {
          totalCustomers: customers.length,
          activeCustomers,
          newCustomers,
          averageOrderValue,
          yearlyNewCustomers,
        },
      };
    } catch (error) {
      console.error("Get customer stats (admin) error:", error);
      return {
        success: false,
        message: "Failed to fetch customer stats",
      };
    }
  }

  // Admin: Get new customers for a specific month/year (all customers, not vendor-specific)
  static async getNewCustomersForMonthForAdmin(
    month: number,
    year: number
  ): Promise<ActionResponse<number>> {
    try {
      // Get all customers with orders (no pagination, get all)
      const customersResult = await this.getCustomersWithOrdersForAdmin({
        page: 1,
        limit: 10000,
      });
      if (!customersResult.success || !customersResult.data) {
        return {
          success: false,
          message: "Failed to fetch customers",
        };
      }
      const customers = customersResult.data;
      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 1);
      const newCustomers = customers.filter((customer) => {
        const firstOrder = new Date(customer.firstOrderDate);
        return firstOrder >= startOfMonth && firstOrder < endOfMonth;
      }).length;
      return {
        success: true,
        message: "New customers for month fetched successfully",
        data: newCustomers,
      };
    } catch (error) {
      console.error("Get new customers for month (admin) error:", error);
      return {
        success: false,
        message: "Failed to fetch new customers for month",
      };
    }
  }

  // Cache invalidation
  private static async invalidateCache(): Promise<void> {
    try {
      const keys = await CacheService.keys("users:*");
      await Promise.all(keys.map((key) => CacheService.delete(key)));
    } catch (error) {
      console.error("Cache invalidation error:", error);
    }
  }
}

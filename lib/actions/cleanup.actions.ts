"use server";

import { connectToDB } from "@/lib/mongodb";
import User from "@/lib/models/user.model";
import Order from "@/lib/models/order.model";
import { getCurrentUser } from "@/lib/actions/user.actions";

/**
 * Clean up user's order array by removing IDs of deleted orders
 * This helps maintain data integrity when orders are accidentally deleted
 */
export async function cleanupUserOrders(): Promise<
  ActionResponse<{
    removedCount: number;
    remainingCount: number;
  }>
> {
  try {
    await connectToDB();

    // Get current user
    const userResponse = await getCurrentUser();
    if (!userResponse.success || !userResponse.data) {
      return {
        success: false,
        message: "Failed to get current user",
      };
    }

    const user = userResponse.data;
    const orderIds = user.order || [];

    if (orderIds.length === 0) {
      return {
        success: true,
        data: { removedCount: 0, remainingCount: 0 },
        message: "No orders to clean up",
      };
    }

    // Check which order IDs actually exist in the orders collection
    const existingOrders = await Order.find({
      _id: { $in: orderIds },
    })
      .select("_id")
      .lean<IOrder[]>();

    const existingOrderIds = existingOrders.map((order) =>
      order._id.toString()
    );
    const validOrderIds = orderIds.filter((id) =>
      existingOrderIds.includes(id.toString())
    );

    const removedCount = orderIds.length - validOrderIds.length;

    // Update user's order array with only valid order IDs
    if (removedCount > 0) {
      await User.findByIdAndUpdate(
        user._id,
        { $set: { order: validOrderIds } },
        { new: true }
      );
    }

    return {
      success: true,
      data: {
        removedCount,
        remainingCount: validOrderIds.length,
      },
      message:
        removedCount > 0
          ? `Cleaned up ${removedCount} invalid order reference${
              removedCount > 1 ? "s" : ""
            }`
          : "No cleanup needed - all order references are valid",
    };
  } catch (error) {
    console.error("Cleanup user orders error:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to clean up user orders",
    };
  }
}

/**
 * Admin function to clean up all users' order arrays
 * This should be used carefully and preferably in a maintenance script
 */
export async function cleanupAllUsersOrders(): Promise<
  ActionResponse<{
    usersProcessed: number;
    totalOrdersRemoved: number;
  }>
> {
  try {
    await connectToDB();

    // Get all users who have orders
    const users = await User.find({
      order: { $exists: true, $not: { $size: 0 } },
    })
      .select("_id order")
      .lean();

    let totalOrdersRemoved = 0;
    const usersProcessed = users.length;

    for (const user of users) {
      const orderIds = user.order || [];

      if (orderIds.length === 0) continue;

      // Check which order IDs actually exist
      const existingOrders = await Order.find({
        _id: { $in: orderIds },
      })
        .select("_id")
        .lean<IOrder[]>();

      const existingOrderIds = existingOrders.map((order) =>
        order._id.toString()
      );
      const validOrderIds = orderIds.filter((id: string) =>
        existingOrderIds.includes(id.toString())
      );

      const removedCount = orderIds.length - validOrderIds.length;
      totalOrdersRemoved += removedCount;

      // Update user's order array with only valid order IDs
      if (removedCount > 0) {
        await User.findByIdAndUpdate(
          user._id,
          { $set: { order: validOrderIds } },
          { new: true }
        );
      }
    }

    return {
      success: true,
      data: {
        usersProcessed,
        totalOrdersRemoved,
      },
      message: `Processed ${usersProcessed} users and removed ${totalOrdersRemoved} invalid order references`,
    };
  } catch (error) {
    console.error("Cleanup all users orders error:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to clean up all users orders",
    };
  }
}

/**
 * Order cleanup utilities
 * This helps clean up any orphaned orders that might be left in unconfirmed state
 */

import Order from "@/lib/models/order.model";
import { connectToDB } from "@/lib/mongodb";

/**
 * Clean up unconfirmed orders older than specified minutes
 * This prevents the database from accumulating failed payment orders
 */
export const cleanupOrphanedOrders = async (maxAgeMinutes: number = 30): Promise<{
  success: boolean;
  deletedCount: number;
  error?: string;
}> => {
  try {
    await connectToDB();

    // Calculate cutoff time (orders older than maxAgeMinutes)
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - maxAgeMinutes);

    // Find and delete unconfirmed orders older than cutoff time
    const result = await Order.deleteMany({
      status: "unconfirmed",
      paymentStatus: "pending",
      createdAt: { $lt: cutoffTime }
    });

    console.log(`Cleaned up ${result.deletedCount} orphaned orders older than ${maxAgeMinutes} minutes`);

    return {
      success: true,
      deletedCount: result.deletedCount
    };
  } catch (error) {
    console.error("Error cleaning up orphaned orders:", error);
    return {
      success: false,
      deletedCount: 0,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
};

/**
 * Get count of unconfirmed orders (for monitoring)
 */
export const getUnconfirmedOrderCount = async (): Promise<number> => {
  try {
    await connectToDB();
    return await Order.countDocuments({
      status: "unconfirmed",
      paymentStatus: "pending"
    });
  } catch (error) {
    console.error("Error getting unconfirmed order count:", error);
    return 0;
  }
};

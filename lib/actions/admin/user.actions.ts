"use server";

import { connectToDB } from "@/lib/mongodb";
import User from "@/lib/models/user.model";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "../../nextAuthConfig";
import { UserService } from "@/services/user.service";

// Helper function to convert MongoDB user to safe user response
const sanitizeUser = (user: IUser): UserResponse => {
  const { ...safeUser } = user;

  return {
    ...safeUser,
    _id: safeUser._id.toString(),
    wishlist: safeUser.wishlist?.map((id) => id.toString()),
    cart: safeUser.cart?.map((id) => id.toString()),
    order: safeUser.order?.map((id) => id.toString()),
  };
};

// Get current user details
export async function getCurrentUser(): Promise<ActionResponse<UserResponse>> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email && session?.user.role !== "user") {
      return {
        success: false,
        message: "Not authenticated",
      };
    }

    await connectToDB();

    const user = await User.findOne({ email: session.user.email }).lean();

    if (!user) {
      return {
        success: false,
        message: "User not found",
      };
    }

    return {
      success: true,
      message: "User details fetched successfully",
      data: sanitizeUser(user as IUser),
    };
  } catch (error) {
    console.error("Error fetching user details:", error);
    return {
      success: false,
      message: "Failed to fetch user details",
    };
  }
}

// Get user by ID (for admin purposes)
export async function getUserById(
  userId: string
): Promise<ActionResponse<UserResponse>> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email && session?.user.role !== "user") {
      return {
        success: false,
        message: "Not authenticated",
      };
    }

    await connectToDB();

    const user = await User.findById(userId).lean();

    if (!user) {
      return {
        success: false,
        message: "User not found",
      };
    }

    return {
      success: true,
      message: "User details fetched successfully",
      data: sanitizeUser(user as IUser),
    };
  } catch (error) {
    console.error("Error fetching user:", error);
    return {
      success: false,
      message: "Failed to fetch user",
    };
  }
}

// Update user profile
export async function updateUserProfile(
  data: Partial<Pick<IUser, "name" | "email" | "phone">>
): Promise<ActionResponse<UserResponse>> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email && session?.user.role !== "user") {
      return {
        success: false,
        message: "Not authenticated",
      };
    }

    await connectToDB();

    // If email is being updated, check if it's already in use
    if (data.email && data.email !== session.user.email) {
      const existingUser = await User.findOne({
        email: data.email,
        _id: { $ne: session.user.id },
      });

      if (existingUser) {
        return {
          success: false,
          message: "Email already in use",
        };
      }
    }

    // If phone is being updated, check if it's already in use
    if (data.phone) {
      const existingUser = await User.findOne({
        phone: data.phone,
        _id: { $ne: session.user.id },
      });

      if (existingUser) {
        return {
          success: false,
          message: "Phone number already in use",
        };
      }
    }

    const updatedUser = await User.findOneAndUpdate(
      { email: session.user.email },
      { $set: data },
      { new: true }
    ).lean();

    if (!updatedUser) {
      return {
        success: false,
        message: "User not found",
      };
    }

    // Revalidate relevant paths
    revalidatePath("/profile");
    revalidatePath("/account");
    revalidatePath("/wishlist"); // Since user has wishlist field

    return {
      success: true,
      message: "Profile updated successfully",
      data: sanitizeUser(updatedUser as IUser),
    };
  } catch (error) {
    console.error("Error updating user profile:", error);
    return {
      success: false,
      message: "Failed to update profile",
    };
  }
}

// Add to wishlist
export async function addToWishlist(
  productId: string
): Promise<ActionResponse<UserResponse>> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email && session?.user.role !== "user") {
      return {
        success: false,
        message: "Not authenticated",
      };
    }

    await connectToDB();

    const updatedUser = await User.findOneAndUpdate(
      { email: session.user.email },
      { $addToSet: { wishlist: productId } }, // Use addToSet to prevent duplicates
      { new: true }
    ).lean();

    if (!updatedUser) {
      return {
        success: false,
        message: "User not found",
      };
    }

    revalidatePath("/wishlist");

    return {
      success: true,
      message: "Added to wishlist successfully",
      data: sanitizeUser(updatedUser as IUser),
    };
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    return {
      success: false,
      message: "Failed to add to wishlist",
    };
  }
}

// Remove from wishlist
export async function removeFromWishlist(
  productId: string
): Promise<ActionResponse<UserResponse>> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email && session?.user.role !== "user") {
      return {
        success: false,
        message: "Not authenticated",
      };
    }

    await connectToDB();

    const updatedUser = await User.findOneAndUpdate(
      { email: session.user.email },
      { $pull: { wishlist: productId } },
      { new: true }
    ).lean();

    if (!updatedUser) {
      return {
        success: false,
        message: "User not found",
      };
    }

    revalidatePath("/wishlist");

    return {
      success: true,
      message: "Removed from wishlist successfully",
      data: sanitizeUser(updatedUser as IUser),
    };
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    return {
      success: false,
      message: "Failed to remove from wishlist",
    };
  }
}

export async function addToCart(
  productId: string
): Promise<ActionResponse<UserResponse>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return {
        success: false,
        message: "Not authenticated",
      };
    }
    await connectToDB();
    const updatedUser = await User.findOneAndUpdate(
      { email: session.user.email },
      { $addToSet: { cart: productId } }, // Prevent duplicates
      { new: true }
    ).lean();
    if (!updatedUser) {
      return {
        success: false,
        message: "User not found",
      };
    }
    revalidatePath("/cart");
    return {
      success: true,
      message: "Added to cart successfully",
      data: sanitizeUser(updatedUser as IUser),
    };
  } catch (error) {
    console.error("Error adding to cart:", error);
    return {
      success: false,
      message: "Failed to add to cart",
    };
  }
}

// Remove from Cart
export async function removeFromCart(
  productId: string
): Promise<ActionResponse<UserResponse>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return {
        success: false,
        message: "Not authenticated",
      };
    }
    await connectToDB();
    const updatedUser = await User.findOneAndUpdate(
      { email: session.user.email },
      { $pull: { cart: productId } },
      { new: true }
    ).lean();
    if (!updatedUser) {
      return {
        success: false,
        message: "User not found",
      };
    }
    revalidatePath("/cart");
    return {
      success: true,
      message: "Removed from cart successfully",
      data: sanitizeUser(updatedUser as IUser),
    };
  } catch (error) {
    console.error("Error removing from cart:", error);
    return {
      success: false,
      message: "Failed to remove from cart",
    };
  }
}

export async function getAllUsers(
  params: PaginationParams = {}
): Promise<PaginatedResponse<UserResponse>> {
  try {
    await connectToDB();
    return await UserService.getAllUsers(params);
  } catch (error) {
    console.error("Admin getAllUsers error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch users",
    };
  }
}

/**
 * Get all customers with order details - Admin only
 * No authentication check as this is for admin dashboard
 */
export async function getCustomersWithOrdersPaginatedForAdmin(
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
  try {
    await connectToDB();
    return await UserService.getCustomersWithOrdersForAdmin(params);
  } catch (error) {
    console.error(
      "Admin getCustomersWithOrdersPaginatedForAdmin error:",
      error
    );
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch customers with orders",
    };
  }
}

/**
 * Get customer statistics - Admin only
 * No authentication check as this is for admin dashboard
 */
export async function getCustomerStatsForAdmin(): Promise<
  ActionResponse<{
    totalCustomers: number;
    activeCustomers: number;
    newCustomers: number;
    averageOrderValue: number;
    yearlyNewCustomers: { [year: number]: number };
  }>
> {
  try {
    await connectToDB();
    return await UserService.getCustomerStatsForAdmin();
  } catch (error) {
    console.error("Admin getCustomerStatsForAdmin error:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch customer stats",
    };
  }
}

/**
 * Get user by ID - Admin only
 * No authentication check as this is for admin dashboard
 */
export async function getUserByIdForAdmin(
  userId: string
): Promise<ActionResponse<UserResponse>> {
  try {
    await connectToDB();
    return await UserService.getUserById(userId);
  } catch (error) {
    console.error("Admin getUserByIdForAdmin error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch user",
    };
  }
}

/**
 * Update user - Admin only
 * No authentication check as this is for admin dashboard
 */
export async function updateUserForAdmin(
  userId: string,
  data: Partial<IUser>
): Promise<ActionResponse<UserResponse>> {
  try {
    await connectToDB();
    const result = await UserService.updateUser(userId, data);

    if (result.success) {
      // Revalidate admin paths
      revalidatePath("/admin/users");
      revalidatePath("/admin/customers");
      revalidatePath("/vendor/customers");
    }

    return result;
  } catch (error) {
    console.error("Admin updateUserForAdmin error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update user",
    };
  }
}

/**
 * Delete user - Admin only
 * No authentication check as this is for admin dashboard
 */
export async function deleteUserForAdmin(
  userId: string
): Promise<ActionResponse<UserResponse>> {
  try {
    await connectToDB();
    const result = await UserService.deleteUser(userId);

    if (result.success) {
      // Revalidate admin paths
      revalidatePath("/admin/users");
      revalidatePath("/admin/customers");
      revalidatePath("/vendor/customers");
    }

    return result;
  } catch (error) {
    console.error("Admin deleteUserForAdmin error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to delete user",
    };
  }
}

/**
 * Get new customers for a specific month - Admin only
 * No authentication check as this is for admin dashboard
 */
export async function getNewCustomersForMonthForAdmin(
  month: number,
  year: number
): Promise<ActionResponse<number>> {
  try {
    await connectToDB();
    return await UserService.getNewCustomersForMonthForAdmin(month, year);
  } catch (error) {
    console.error("Admin getNewCustomersForMonthForAdmin error:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch new customers for month",
    };
  }
}

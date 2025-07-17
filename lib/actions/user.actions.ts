"use server";

import { connectToDB } from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "../nextAuthConfig";
import { UserService } from "@/services/user.service";

// Get current user details
export async function getCurrentUser(): Promise<ActionResponse<UserResponse>> {
  await connectToDB();
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email && session?.user.role !== "user") {
      return {
        success: false,
        message: "Not authenticated",
      };
    }

    const result = await UserService.getUserByEmail(session.user.email!);
    return result;
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
  await connectToDB();
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email && session?.user.role !== "user") {
      return {
        success: false,
        message: "Not authenticated",
      };
    }

    const result = await UserService.getUserById(userId);
    return result;
  } catch (error) {
    console.error("Error fetching user:", error);
    return {
      success: false,
      message: "Failed to fetch user",
    };
  }
}

// Get user by ID (no authentication check, for admin/vendor API usage)
export async function getUserByIdNoAuth(
  userId: string
): Promise<ActionResponse<UserResponse>> {
  await connectToDB();
  try {
    const result = await UserService.getUserById(userId);
    return result;
  } catch (error) {
    console.error("Error fetching user (no auth):", error);
    return {
      success: false,
      message: "Failed to fetch user (no auth)",
    };
  }
}

// Get all users with pagination, search, and sorting (for admin)
export async function getAllUsers(
  params: PaginationParams = {}
): Promise<PaginatedResponse<UserResponse>> {
  await connectToDB();
  try {
    const session = await getServerSession(authOptions);

    // Check if user is admin/vendor (you might want to check for admin role)
    if (!session?.user?.email) {
      return {
        success: false,
        error: "Not authenticated",
      };
    }

    const result = await UserService.getAllUsers(params);
    return result;
  } catch (error) {
    console.error("Error fetching users:", error);
    return {
      success: false,
      error: "Failed to fetch users",
    };
  }
}

// Get customers with orders for vendor (new method)
export async function getCustomersWithOrders(
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
  await connectToDB();
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return {
        success: false,
        error: "Not authenticated",
      };
    }

    const result = await UserService.getCustomersWithOrders(params);
    return result;
  } catch (error) {
    console.error("Error fetching customers with orders:", error);
    return {
      success: false,
      error: "Failed to fetch customers with orders",
    };
  }
}

export async function getCustomersWithOrdersPaginated(
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
  await connectToDB();
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return {
        success: false,
        error: "Not authenticated",
      };
    }

    const result = await UserService.getCustomersWithOrdersPaginated(params);
    return result;
  } catch (error) {
    console.error("Error fetching customers with orders:", error);
    return {
      success: false,
      error: "Failed to fetch customers with orders",
    };
  }
}

export async function getCustomerStats(): Promise<
  ActionResponse<{
    totalCustomers: number;
    activeCustomers: number;
    newCustomers: number;
    averageOrderValue: number;
    yearlyNewCustomers: { [year: number]: number };
  }>
> {
  await connectToDB();
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return {
        success: false,
        message: "Not authenticated",
      };
    }

    const result = await UserService.getCustomerStats();
    return result;
  } catch (error) {
    console.error("Error fetching customer stats:", error);
    return {
      success: false,
      message: "Failed to fetch customer stats",
    };
  }
}

export async function getNewCustomersForMonth(
  month: number,
  year: number
): Promise<ActionResponse<number>> {
  await connectToDB();
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return {
        success: false,
        message: "Not authenticated",
      };
    }

    const result = await UserService.getNewCustomersForMonth(month, year);
    return result;
  } catch (error) {
    console.error("Error fetching new customers for month:", error);
    return {
      success: false,
      message: "Failed to fetch new customers for month",
    };
  }
}

// Get all users (legacy method)
export async function getAllUsersLegacy(): Promise<
  ActionResponse<UserResponse[]>
> {
  await connectToDB();
  try {
    const session = await getServerSession(authOptions);

    // Check if user is admin (you might want to check for admin role)
    if (!session?.user?.email) {
      return {
        success: false,
        message: "Not authenticated",
      };
    }

    const result = await UserService.getAllUsersLegacy();
    return result;
  } catch (error) {
    console.error("Error fetching users:", error);
    return {
      success: false,
      message: "Failed to fetch users",
    };
  }
}

// Update user profile
export async function updateUserProfile(
  data: Partial<Pick<IUser, "name" | "email" | "phone">>
): Promise<ActionResponse<UserResponse>> {
  await connectToDB();
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email && session?.user.role !== "user") {
      return {
        success: false,
        message: "Not authenticated",
      };
    }

    // Get current user to get their ID
    const currentUserResult = await UserService.getUserByEmail(
      session.user.email!
    );
    if (!currentUserResult.success || !currentUserResult.data) {
      return {
        success: false,
        message: "User not found",
      };
    }

    const result = await UserService.updateUser(
      currentUserResult.data._id,
      data
    );

    if (result.success) {
      // Revalidate relevant paths
      revalidatePath("/profile");
      revalidatePath("/account");
      revalidatePath("/wishlist");
    }

    return result;
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
  await connectToDB();
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email && session?.user.role !== "user") {
      return {
        success: false,
        message: "Not authenticated",
      };
    }

    // Get current user to get their ID
    const currentUserResult = await UserService.getUserByEmail(
      session.user.email!
    );
    if (!currentUserResult.success || !currentUserResult.data) {
      return {
        success: false,
        message: "User not found",
      };
    }

    const result = await UserService.addToWishlist(
      currentUserResult.data._id,
      productId
    );

    if (result.success) {
      revalidatePath("/wishlist");
    }

    return result;
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
  await connectToDB();
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email && session?.user.role !== "user") {
      return {
        success: false,
        message: "Not authenticated",
      };
    }

    // Get current user to get their ID
    const currentUserResult = await UserService.getUserByEmail(
      session.user.email!
    );
    if (!currentUserResult.success || !currentUserResult.data) {
      return {
        success: false,
        message: "User not found",
      };
    }

    const result = await UserService.removeFromWishlist(
      currentUserResult.data._id,
      productId
    );

    if (result.success) {
      revalidatePath("/wishlist");
    }

    return result;
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    return {
      success: false,
      message: "Failed to remove from wishlist",
    };
  }
}

// Add to cart
export async function addToCart(
  productId: string
): Promise<ActionResponse<UserResponse>> {
  await connectToDB();
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return {
        success: false,
        message: "Not authenticated",
      };
    }

    // Get current user to get their ID
    const currentUserResult = await UserService.getUserByEmail(
      session.user.email
    );
    if (!currentUserResult.success || !currentUserResult.data) {
      return {
        success: false,
        message: "User not found",
      };
    }

    const result = await UserService.addToCart(
      currentUserResult.data._id,
      productId
    );

    if (result.success) {
      revalidatePath("/cart");
    }

    return result;
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
  await connectToDB();
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return {
        success: false,
        message: "Not authenticated",
      };
    }

    // Get current user to get their ID
    const currentUserResult = await UserService.getUserByEmail(
      session.user.email
    );
    if (!currentUserResult.success || !currentUserResult.data) {
      return {
        success: false,
        message: "User not found",
      };
    }

    const result = await UserService.removeFromCart(
      currentUserResult.data._id,
      productId
    );

    if (result.success) {
      revalidatePath("/cart");
    }

    return result;
  } catch (error) {
    console.error("Error removing from cart:", error);
    return {
      success: false,
      message: "Failed to remove from cart",
    };
  }
}

// Admin function to create user
export async function createUser(
  data: Partial<IUser>
): Promise<ActionResponse<UserResponse>> {
  await connectToDB();
  try {
    const session = await getServerSession(authOptions);

    // Check if user is admin (you might want to check for admin role)
    if (!session?.user?.email) {
      return {
        success: false,
        message: "Not authenticated",
      };
    }

    const result = await UserService.createUser(data);
    return result;
  } catch (error) {
    console.error("Error creating user:", error);
    return {
      success: false,
      message: "Failed to create user",
    };
  }
}

// Admin function to update any user
export async function updateUser(
  userId: string,
  data: Partial<IUser>
): Promise<ActionResponse<UserResponse>> {
  await connectToDB();
  try {
    const session = await getServerSession(authOptions);

    // Check if user is admin (you might want to check for admin role)
    if (!session?.user?.email) {
      return {
        success: false,
        message: "Not authenticated",
      };
    }

    const result = await UserService.updateUser(userId, data);
    return result;
  } catch (error) {
    console.error("Error updating user:", error);
    return {
      success: false,
      message: "Failed to update user",
    };
  }
}

// Admin function to delete user
export async function deleteUser(
  userId: string
): Promise<ActionResponse<UserResponse>> {
  await connectToDB();
  try {
    const session = await getServerSession(authOptions);

    // Check if user is admin (you might want to check for admin role)
    if (!session?.user?.email) {
      return {
        success: false,
        message: "Not authenticated",
      };
    }

    const result = await UserService.deleteUser(userId);
    return result;
  } catch (error) {
    console.error("Error deleting user:", error);
    return {
      success: false,
      message: "Failed to delete user",
    };
  }
}

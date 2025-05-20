"use server";

import { connectToDB } from "@/lib/mongodb";
import User from "@/lib/models/user.model";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "../nextAuthConfig";

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

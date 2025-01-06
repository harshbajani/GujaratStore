/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { connectToDB } from "@/lib/mongodb";
import User from "@/lib/models/user.model";
import { getServerSession } from "next-auth";

import { ActionResponse, UserResponse } from "@/types/index";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";

// Helper function to convert MongoDB user to safe user response
const sanitizeUser = (user: any): UserResponse => {
  const { ...safeUser } = user;

  return {
    ...safeUser,
    _id: safeUser._id.toString(),
    shippingAddresses: safeUser.shippingAddresses?.map((addr: any) => ({
      ...addr,
      _id: addr._id.toString(),
    })),
    wishlist: safeUser.wishlist?.map((id: any) => id.toString()),
  };
};

// Get current user details
export async function getCurrentUser(): Promise<ActionResponse<UserResponse>> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
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
      data: sanitizeUser(user),
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

    if (!session?.user?.email) {
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
      data: sanitizeUser(user),
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
interface UpdateUserData {
  name?: string;
  phone?: string;
  gender?: "male" | "female" | "other";
  dateOfBirth?: Date;
  profileImage?: string;
}

export async function updateUserProfile(
  data: UpdateUserData
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
      { $set: data },
      { new: true, runValidators: true }
    ).lean();

    if (!updatedUser) {
      return {
        success: false,
        message: "User not found",
      };
    }

    revalidatePath("/profile");

    return {
      success: true,
      message: "Profile updated successfully",
      data: sanitizeUser(updatedUser),
    };
  } catch (error) {
    console.error("Error updating profile:", error);
    return {
      success: false,
      message: "Failed to update profile",
    };
  }
}

// Add shipping address
interface ShippingAddress {
  address: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

export async function addShippingAddress(
  address: ShippingAddress
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

    // If the new address is default, unset other default addresses
    if (address.isDefault) {
      await User.updateOne(
        { email: session.user.email },
        { $set: { "shippingAddresses.$[].isDefault": false } }
      );
    }

    const updatedUser = await User.findOneAndUpdate(
      { email: session.user.email },
      { $push: { shippingAddresses: address } },
      { new: true }
    ).lean();

    if (!updatedUser) {
      return {
        success: false,
        message: "User not found",
      };
    }

    revalidatePath("/profile/addresses");

    return {
      success: true,
      message: "Address added successfully",
      data: sanitizeUser(updatedUser),
    };
  } catch (error) {
    console.error("Error adding address:", error);
    return {
      success: false,
      message: "Failed to add address",
    };
  }
}

// Delete shipping address
export async function deleteShippingAddress(
  addressId: string
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
      { $pull: { shippingAddresses: { _id: addressId } } },
      { new: true }
    ).lean();

    if (!updatedUser) {
      return {
        success: false,
        message: "User not found",
      };
    }

    revalidatePath("/profile/addresses");

    return {
      success: true,
      message: "Address deleted successfully",
      data: sanitizeUser(updatedUser),
    };
  } catch (error) {
    console.error("Error deleting address:", error);
    return {
      success: false,
      message: "Failed to delete address",
    };
  }
}

// Add to wishlist
export async function addToWishlist(
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
      data: sanitizeUser(updatedUser),
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

    if (!session?.user?.email) {
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
      data: sanitizeUser(updatedUser),
    };
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    return {
      success: false,
      message: "Failed to remove from wishlist",
    };
  }
}

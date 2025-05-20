"use server";

import { connectToDB } from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import Vendor from "../models/vendor.model";
import { authOptions } from "../nextAuthConfig";

// Helper function to convert MongoDB user to safe user response
const sanitizeUser = (user: IVendor): VendorResponse => {
  const { ...safeUser } = user;

  return {
    ...safeUser,
    _id: safeUser._id.toString(),
  };
};

export async function getAllVendors(): Promise<
  ActionResponse<VendorResponse[]>
> {
  try {
    const session = await getServerSession(authOptions);

    // You can change the role check depending on your requirements.
    if (!session?.user?.email) {
      return {
        success: false,
        message: "Not authenticated or not authorized",
      };
    }

    await connectToDB();

    const vendors = await Vendor.find({}).lean();
    const sanitizedVendors = vendors.map((vendor) =>
      sanitizeUser(vendor as IVendor)
    );

    return {
      success: true,
      message: "Vendors fetched successfully",
      data: sanitizedVendors,
    };
  } catch (error) {
    console.error("Error fetching vendors:", error);
    return {
      success: false,
      message: "Failed to fetch vendors",
    };
  }
}

// Get current user details
export async function getCurrentVendor(): Promise<
  ActionResponse<VendorResponse>
> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email && session?.user.role !== "vendor") {
      return {
        success: false,
        message: "Not authenticated",
      };
    }

    await connectToDB();

    const user = await Vendor.findOne({ email: session.user.email }).lean();

    if (!user) {
      return {
        success: false,
        message: "User not found",
      };
    }

    return {
      success: true,
      message: "User details fetched successfully",
      data: sanitizeUser(user as IVendor),
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
export async function getVendorById(
  userId: string
): Promise<ActionResponse<VendorResponse>> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email && session?.user.role !== "vendor") {
      return {
        success: false,
        message: "Not authenticated",
      };
    }

    await connectToDB();

    const user = await Vendor.findById(userId).lean();

    if (!user) {
      return {
        success: false,
        message: "User not found",
      };
    }

    return {
      success: true,
      message: "User details fetched successfully",
      data: sanitizeUser(user as IVendor),
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
export async function updateVendorProfile(
  data: Partial<Pick<IVendor, "name" | "email" | "phone">>
): Promise<ActionResponse<VendorResponse>> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email && session?.user.role !== "vendor") {
      return {
        success: false,
        message: "Not authenticated",
      };
    }

    await connectToDB();

    // If email is being updated, check if it's already in use
    if (data.email && data.email !== session.user.email) {
      const existingUser = await Vendor.findOne({
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
      const existingUser = await Vendor.findOne({
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

    const updatedUser = await Vendor.findOneAndUpdate(
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

    return {
      success: true,
      message: "Profile updated successfully",
      data: sanitizeUser(updatedUser as IVendor),
    };
  } catch (error) {
    console.error("Error updating user profile:", error);
    return {
      success: false,
      message: "Failed to update profile",
    };
  }
}

export async function deleteVendor(
  vendorId: string
): Promise<ActionResponse<null>> {
  try {
    const session = await getServerSession(authOptions);

    // Change role check if needed
    if (!session?.user?.email) {
      return {
        success: false,
        message: "Not authenticated or not authorized",
      };
    }

    await connectToDB();

    const deletedVendor = await Vendor.findByIdAndDelete(vendorId);
    if (!deletedVendor) {
      return {
        success: false,
        message: "Vendor not found",
      };
    }

    // Optionally, revalidate relevant paths if needed
    revalidatePath("/admin/vendor");

    return {
      success: true,
      message: "Vendor deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting vendor:", error);
    return {
      success: false,
      message: "Failed to delete vendor",
    };
  }
}

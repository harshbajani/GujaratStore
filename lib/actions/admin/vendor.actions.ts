"use server";

import { connectToDB } from "@/lib/mongodb";
import { getServerSession } from "next-auth";

import { ActionResponse, IVendor, VendorResponse } from "@/types/index";
import { revalidatePath } from "next/cache";
import Vendor from "../../models/vendor.model";
import { authOptions } from "../../nextAuthConfig";

// Helper function to convert MongoDB user to safe user response
const sanitizeUser = (user: IVendor): VendorResponse => {
  const { ...safeUser } = user;

  return {
    ...safeUser,
    _id: safeUser._id.toString(),
  };
};

export type VendorUpdateData = Partial<{
  name: string;
  email: string;
  phone: string;
  store: {
    storeName?: string;
    contact?: string;
    addresses?: {
      address_line_1: string;
      address_line_2: string;
      locality: string;
      pincode: string;
      state: string;
      landmark?: string;
    };
    alternativeContact?: string;
  };
}>;

export async function createVendor(
  data: VendorUpdateData & { isVerified?: boolean }
) {
  try {
    // Ensure email doesn't already exist
    const existing = await Vendor.findOne({ email: data.email });
    if (existing) {
      return { success: false, message: "Vendor already exists" };
    }

    await Vendor.create({
      ...data,
      // Set default to false if isVerified not provided (i.e., vendor self-registering)
      isVerified: data.isVerified ?? false,
    });

    return {
      success: true,
      message: "Vendor added successfully",
    };
  } catch (error) {
    console.error("createVendor error:", error);
    return { success: false, message: "Something went wrong" };
  }
}

export async function getAllVendors(): Promise<
  ActionResponse<VendorResponse[]>
> {
  try {
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

export async function updateVendorById(
  vendorId: string,
  data: VendorUpdateData
): Promise<ActionResponse<VendorResponse>> {
  try {
    await connectToDB();

    // Check for duplicate email if email is being updated
    if (data.email) {
      const existingVendor = await Vendor.findOne({
        email: data.email,
        _id: { $ne: vendorId },
      });
      if (existingVendor) {
        return {
          success: false,
          message: "Email already in use",
        };
      }
    }

    // Check for duplicate phone if phone is being updated
    if (data.phone) {
      const existingVendor = await Vendor.findOne({
        phone: data.phone,
        _id: { $ne: vendorId },
      });
      if (existingVendor) {
        return {
          success: false,
          message: "Phone number already in use",
        };
      }
    }

    // Update vendor including nested store details if provided
    const updatedVendor = await Vendor.findByIdAndUpdate(
      vendorId,
      { $set: data },
      { new: true }
    ).lean();

    if (!updatedVendor) {
      return {
        success: false,
        message: "Vendor not found",
      };
    }

    // Revalidate the admin vendor list page (if needed)
    revalidatePath("/admin/vendor");

    return {
      success: true,
      message: "Vendor updated successfully",
      data: sanitizeUser(updatedVendor as IVendor),
    };
  } catch (error) {
    console.error("Error updating vendor:", error);
    return {
      success: false,
      message: "Failed to update vendor",
    };
  }
}

export async function deleteVendor(
  vendorId: string
): Promise<ActionResponse<null>> {
  try {
    // Custom admin authentication is assumed to be handled externally

    await connectToDB();

    const deletedVendor = await Vendor.findByIdAndDelete(vendorId);
    if (!deletedVendor) {
      return {
        success: false,
        message: "Vendor not found",
      };
    }

    // Revalidate the admin vendor list page (if needed)
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

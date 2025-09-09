"use server";

import { revalidatePath } from "next/cache";
import { connectToDB } from "@/lib/mongodb";
import { vendorIdentitySchema } from "@/lib/validations";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import Vendor from "@/lib/models/vendor.model";

export async function createVendorIdentity(data: {
  aadharCardNumber: string;
  aadharCardDoc: string;
  panCard: string;
  panCardDoc: string;
}) {
  try {
    const validatedData = vendorIdentitySchema.parse(data);
    await connectToDB();

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      throw new Error("Unauthorized");
    }

    const updatedVendor = await Vendor.findOneAndUpdate(
      { email: session.user.email },
      { vendorIdentity: validatedData },
      { new: true }
    ).lean();

    if (!updatedVendor || Array.isArray(updatedVendor)) {
      throw new Error("Failed to create vendor identity");
    }

    // Sanitize the vendorIdentity data to convert ObjectIds to strings
    const sanitizedVendorIdentity = JSON.parse(JSON.stringify(updatedVendor.vendorIdentity));
    if (sanitizedVendorIdentity._id && typeof sanitizedVendorIdentity._id === 'object') {
      sanitizedVendorIdentity._id = sanitizedVendorIdentity._id.toString();
    }

    revalidatePath("/vendor/account");
    return {
      success: true,
      data: sanitizedVendorIdentity,
    };
  } catch (error) {
    console.error("Error creating vendor identity:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create vendor identity",
    };
  }
}

export async function updateVendorIdentity(data: {
  aadharCardNumber: string;
  aadharCardDoc: string;
  panCard: string;
  panCardDoc: string;
}) {
  try {
    const validatedData = vendorIdentitySchema.parse(data);
    await connectToDB();

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      throw new Error("Unauthorized");
    }

    const updatedVendor = await Vendor.findOneAndUpdate(
      { email: session.user.email },
      { vendorIdentity: validatedData },
      { new: true }
    ).lean();

    if (!updatedVendor || Array.isArray(updatedVendor)) {
      throw new Error("Failed to update vendor identity");
    }

    // Sanitize the vendorIdentity data to convert ObjectIds to strings
    const sanitizedVendorIdentity = JSON.parse(JSON.stringify(updatedVendor.vendorIdentity));
    if (sanitizedVendorIdentity._id && typeof sanitizedVendorIdentity._id === 'object') {
      sanitizedVendorIdentity._id = sanitizedVendorIdentity._id.toString();
    }

    revalidatePath("/vendor/account");
    return {
      success: true,
      data: sanitizedVendorIdentity,
    };
  } catch (error) {
    console.error("Error updating vendor identity:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update vendor identity",
    };
  }
}

export async function getVendorIdentity() {
  try {
    await connectToDB();

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      throw new Error("Unauthorized");
    }

    const vendor = await Vendor.findOne({ email: session.user.email }).lean();

    if (!vendor || Array.isArray(vendor)) {
      throw new Error("Vendor not found");
    }

    // Sanitize the vendorIdentity data to convert ObjectIds to strings
    let sanitizedVendorIdentity = null;
    if (vendor.vendorIdentity) {
      sanitizedVendorIdentity = JSON.parse(JSON.stringify(vendor.vendorIdentity));
      if (sanitizedVendorIdentity._id && typeof sanitizedVendorIdentity._id === 'object') {
        sanitizedVendorIdentity._id = sanitizedVendorIdentity._id.toString();
      }
    }

    return {
      success: true,
      data: sanitizedVendorIdentity,
    };
  } catch (error) {
    console.error("Error getting vendor identity:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get vendor identity",
    };
  }
}

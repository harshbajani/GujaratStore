"use server";

import { revalidatePath } from "next/cache";
import { connectToDB } from "@/lib/mongodb";
import { businessIdentitySchema } from "@/lib/validations";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import Vendor from "@/lib/models/vendor.model";

type BusinessData = {
  MSMECertificate?: string;
  UdhyamAadhar?: string;
  Fassai?: string;
  CorporationCertificate?: string;
  OtherDocuments?: string;
};

export async function createBusinessIdentity(data: BusinessData) {
  try {
    const validatedData = businessIdentitySchema.parse(data);
    await connectToDB();

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      throw new Error("Unauthorized");
    }

    const updatedVendor = await Vendor.findOneAndUpdate(
      { email: session.user.email },
      { businessIdentity: validatedData },
      { new: true }
    ).lean();

    if (!updatedVendor || Array.isArray(updatedVendor)) {
      throw new Error("Failed to create business identity");
    }

    // Sanitize the businessIdentity data to convert ObjectIds to strings
    const sanitizedBusinessIdentity = JSON.parse(JSON.stringify(updatedVendor.businessIdentity));
    if (sanitizedBusinessIdentity._id && typeof sanitizedBusinessIdentity._id === 'object') {
      sanitizedBusinessIdentity._id = sanitizedBusinessIdentity._id.toString();
    }

    revalidatePath("/vendor/account");
    return {
      success: true,
      data: sanitizedBusinessIdentity,
    };
  } catch (error) {
    console.error("Error creating business identity:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create business identity",
    };
  }
}

export async function updateBusinessIdentity(data: BusinessData) {
  try {
    const validatedData = businessIdentitySchema.parse(data);
    await connectToDB();

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      throw new Error("Unauthorized");
    }

    const updatedVendor = await Vendor.findOneAndUpdate(
      { email: session.user.email },
      { businessIdentity: validatedData },
      { new: true }
    ).lean();

    if (!updatedVendor || Array.isArray(updatedVendor)) {
      throw new Error("Failed to update business identity");
    }

    // Sanitize the businessIdentity data to convert ObjectIds to strings
    const sanitizedBusinessIdentity = JSON.parse(JSON.stringify(updatedVendor.businessIdentity));
    if (sanitizedBusinessIdentity._id && typeof sanitizedBusinessIdentity._id === 'object') {
      sanitizedBusinessIdentity._id = sanitizedBusinessIdentity._id.toString();
    }

    revalidatePath("/vendor/account");
    return {
      success: true,
      data: sanitizedBusinessIdentity,
    };
  } catch (error) {
    console.error("Error updating business identity:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update business identity",
    };
  }
}

export async function getBusinessIdentity() {
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

    // Sanitize the businessIdentity data to convert ObjectIds to strings
    let sanitizedBusinessIdentity = null;
    if (vendor.businessIdentity) {
      sanitizedBusinessIdentity = JSON.parse(JSON.stringify(vendor.businessIdentity));
      if (sanitizedBusinessIdentity._id && typeof sanitizedBusinessIdentity._id === 'object') {
        sanitizedBusinessIdentity._id = sanitizedBusinessIdentity._id.toString();
      }
    }

    return {
      success: true,
      data: sanitizedBusinessIdentity,
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

"use server";

import { revalidatePath } from "next/cache";
import { connectToDB } from "@/lib/mongodb";
import { storeSchema } from "@/lib/validations";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import Vendor from "@/lib/models/vendor.model";
import { toInterfaceFormat, toSchemaFormat } from "../utils";

export async function createStore(data: StoreData) {
  try {
    const validatedData = storeSchema.parse(data);
    await connectToDB();

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      throw new Error("Unauthorized");
    }

    const schemaData = toSchemaFormat(validatedData);

    const updatedVendor = await Vendor.findOneAndUpdate(
      { email: session.user.email },
      { store: schemaData },
      { new: true }
    ).lean();

    if (
      !updatedVendor ||
      Array.isArray(updatedVendor) ||
      !updatedVendor.store
    ) {
      throw new Error("Failed to create store");
    }

    const formattedData = toInterfaceFormat(updatedVendor.store);
    if (!formattedData) {
      throw new Error("Failed to process store data");
    }

    revalidatePath("/vendor/store");
    return {
      success: true,
      data: formattedData,
    };
  } catch (error) {
    console.error("Error creating store:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create store",
    };
  }
}

export async function updateStore(data: StoreData) {
  try {
    const validatedData = storeSchema.parse(data);
    await connectToDB();

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      throw new Error("Unauthorized");
    }

    const schemaData = toSchemaFormat(validatedData);

    const updatedVendor = await Vendor.findOneAndUpdate(
      { email: session.user.email },
      { store: schemaData },
      { new: true }
    ).lean();

    if (
      !updatedVendor ||
      Array.isArray(updatedVendor) ||
      !updatedVendor.store
    ) {
      throw new Error("Failed to update store");
    }

    const formattedData = toInterfaceFormat(updatedVendor.store);
    if (!formattedData) {
      throw new Error("Failed to process store data");
    }

    revalidatePath("/vendor/store");
    return {
      success: true,
      data: formattedData,
    };
  } catch (error) {
    console.error("Error updating store:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update store",
    };
  }
}

export async function getStore() {
  try {
    await connectToDB();

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      throw new Error("Unauthorized");
    }

    const vendor = await Vendor.findOne({ email: session.user.email }).lean();

    if (!vendor) {
      return { success: false, error: "Vendor not found" };
    }

    if (Array.isArray(vendor) || !vendor.store) {
      return { success: false, error: "Store not found" };
    }

    const formattedData = toInterfaceFormat(vendor.store);
    if (!formattedData) {
      return { success: false, error: "Failed to process store data" };
    }
    return {
      success: true,
      data: formattedData,
    };
  } catch (error) {
    console.error("Error fetching store:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch store",
    };
  }
}

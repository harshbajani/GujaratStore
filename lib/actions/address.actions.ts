"use server";

import { revalidatePath } from "next/cache";
import User from "@/lib/models/user.model";
import { connectToDB } from "@/lib/mongodb";
import { deliveryAddress } from "@/lib/validations";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import { IAddress } from "@/types";
import { z } from "zod";
import { Document } from "mongoose";

// * Add the address
export async function addAddress(address: IAddress) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return { success: false, message: "Not authenticated" };
    }

    const validatedAddress = deliveryAddress.parse(address);

    await connectToDB();

    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      { $push: { addresses: validatedAddress } },
      { new: true }
    );

    if (!user) {
      return { success: false, message: "User not found" };
    }

    revalidatePath("/profile");

    // * Convert addresses to a serializable format
    const addresses = user.addresses.map((addr: Document & IAddress) => ({
      ...addr.toObject(), // * Convert Mongoose document to plain object
      _id: addr._id ? addr._id.toString() : "",
    }));

    return { success: true, addresses };
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return { success: false, message: "Invalid address data" };
    }
    return { success: false, message: "Failed to add address" };
  }
}

// * update the address
export async function updateAddress(addressId: string, address: IAddress) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return { success: false, message: "Not authenticated" };
    }

    const validatedAddress = deliveryAddress.parse(address);

    await connectToDB();

    // * Use the correct query to find the user and update the specific address
    const user = await User.findOneAndUpdate(
      {
        email: session.user.email,
        "addresses._id": addressId, // * Ensure this matches the address ID
      },
      {
        $set: {
          "addresses.$._id": validatedAddress._id,
          "addresses.$.name": validatedAddress.name,
          "addresses.$.contact": validatedAddress.contact,
          "addresses.$.type": validatedAddress.type,
          "addresses.$.address_line_1": validatedAddress.address_line_1,
          "addresses.$.address_line_2": validatedAddress.address_line_2,
          "addresses.$.locality": validatedAddress.locality,
          "addresses.$.pincode": validatedAddress.pincode,
          "addresses.$.state": validatedAddress.state,
          "addresses.$.landmark": validatedAddress.landmark,
          "addresses.$.alternativeContact": validatedAddress.alternativeContact,
        },
      },
      { new: true }
    );

    if (!user) {
      return { success: false, message: "User or address not found" };
    }

    revalidatePath("/profile");

    // Convert addresses to a serializable format
    const addresses = user.addresses.map((addr: Document & IAddress) => ({
      ...addr.toObject(),
      _id: addr._id ? addr._id.toString() : "",
    }));

    return { success: true, addresses };
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return { success: false, message: "Invalid address data" };
    }
    return { success: false, message: "Failed to update address" };
  }
}

// * delete address
export async function deleteAddress(addressId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return { success: false, message: "Not authenticated" };
    }

    await connectToDB();

    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      { $pull: { addresses: { _id: addressId } } }, // * Using $pull to remove from array
      { new: true }
    );

    if (!user) {
      return { success: false, message: "User not found" };
    }

    revalidatePath("/profile");
    return { success: true };
  } catch {
    return { success: false, message: "Failed to delete address" };
  }
}

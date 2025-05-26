"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { VendorService } from "@/services/vendor.service";
import { authOptions } from "../nextAuthConfig";

export async function getAllVendors() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return {
      success: false,
      message: "Not authenticated or not authorized",
    };
  }

  return await VendorService.getAllVendors();
}

export async function getCurrentVendor() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || session?.user.role !== "vendor") {
    return {
      success: false,
      message: "Not authenticated",
    };
  }

  return await VendorService.getVendorByEmail(session.user.email);
}

export async function updateVendorProfile(
  data: Partial<Pick<IVendor, "name" | "email" | "phone">>
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || session?.user.role !== "vendor") {
    return {
      success: false,
      message: "Not authenticated",
    };
  }

  const result = await VendorService.updateVendor(
    session.user.id,
    data,
    session.user.email
  );

  if (result.success) {
    revalidatePath("/profile");
    revalidatePath("/account");
  }

  return result;
}

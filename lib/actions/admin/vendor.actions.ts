"use server";

import { VendorService } from "@/services/vendor.service";
import { revalidatePath } from "next/cache";

export type VendorUpdateData = Partial<{
  name: string;
  email: string;
  phone: string;
  password: string;
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
  data: VendorUpdateData & { password: string; isVerified?: boolean }
) {
  const result = await VendorService.createVendor(data);

  if (result.success) {
    revalidatePath("/admin/vendor");
  }

  return result;
}

export async function getAllVendors() {
  return await VendorService.getAllVendors();
}

export async function getVendorById(id: string) {
  return await VendorService.getVendorById(id);
}

export async function updateVendorById(id: string, data: VendorUpdateData) {
  const result = await VendorService.updateVendor(id, data);

  if (result.success) {
    revalidatePath("/admin/vendor");
  }

  return result;
}

export async function deleteVendor(id: string) {
  const result = await VendorService.deleteVendor(id);

  if (result.success) {
    revalidatePath("/admin/vendor");
  }

  return result;
}

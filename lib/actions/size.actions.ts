"use server";

import { revalidatePath } from "next/cache";
import { SizeService } from "@/services/size.service";

export async function createSize(
  label: string,
  value: string,

  isActive: boolean = true
) {
  const result = await SizeService.createSize({ label, value, isActive });
  if (result.success) revalidatePath("/vendor/size");
  return result;
}

export async function getAllSizes() {
  return await SizeService.getAllSizes();
}

export async function getSizeById(id: string) {
  return await SizeService.getSizeById(id);
}

export async function updateSize(id: string, data: Partial<ISize>) {
  const result = await SizeService.updateSize(id, data);
  if (result.success) revalidatePath("/vendor/size");
  return result;
}

export async function deleteSize(id: string) {
  const result = await SizeService.deleteSize(id);
  if (result.success) revalidatePath("/vendor/size");
  return result;
}

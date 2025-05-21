"use server";

import { revalidatePath } from "next/cache";
import { AttributeService } from "@/services/attribute.service";

export async function createAttribute(name: string, isActive: boolean) {
  const result = await AttributeService.createAttribute(name, isActive);
  if (result.success) revalidatePath("/vendor/attribute");
  return result;
}

export async function getAllAttributes() {
  return await AttributeService.getAllAttributes();
}

export async function getAttributeById(id: string) {
  return await AttributeService.getAttributeById(id);
}

export async function updateAttribute(id: string, data: AttributeFormData) {
  const result = await AttributeService.updateAttribute(id, data);
  if (result.success) revalidatePath("/vendor/attribute");
  return result;
}

export async function deleteAttribute(id: string) {
  const result = await AttributeService.deleteAttribute(id);
  if (result.success) revalidatePath("/vendor/attribute");
  return result;
}

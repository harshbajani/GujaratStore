"use server";

import { revalidatePath } from "next/cache";
import { AttributeService } from "@/services/attribute.service";
import { connectToDB } from "../mongodb";

export async function createAttribute(name: string, isActive: boolean) {
  const result = await AttributeService.createAttribute(name, isActive);
  if (result.success) revalidatePath("/vendor/attribute");
  return result;
}

export async function getAllAttributes(params?: PaginationParams) {
  await connectToDB();
  return await AttributeService.getAllAttributes(params);
}

export async function getAllAttributesLegacy() {
  await connectToDB();
  return await AttributeService.getAllAttributesLegacy();
}

export async function getAttributeById(id: string) {
  await connectToDB();
  return await AttributeService.getAttributeById(id);
}

export async function updateAttribute(id: string, data: AttributeFormData) {
  await connectToDB();
  const result = await AttributeService.updateAttribute(id, data);
  if (result.success) revalidatePath("/vendor/attribute");
  return result;
}

export async function deleteAttribute(id: string) {
  await connectToDB();
  const result = await AttributeService.deleteAttribute(id);
  if (result.success) revalidatePath("/vendor/attribute");
  return result;
}

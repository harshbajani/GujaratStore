"use server";

import { revalidatePath } from "next/cache";
import { ProductService } from "@/services/product.service";

export async function createProduct(data: IProduct) {
  const result = await ProductService.createProduct(data);
  if (result.success) revalidatePath("/vendor/products");
  return result;
}

export async function getProducts(vendorId?: string) {
  return await ProductService.getProducts(vendorId);
}

export async function getProductById(id: string) {
  return await ProductService.getProductById(id);
}

export async function updateProduct(id: string, data: Partial<IProduct>) {
  const result = await ProductService.updateProduct(id, data);
  if (result.success) revalidatePath("/vendor/products");
  return result;
}

export async function deleteProduct(id: string) {
  const result = await ProductService.deleteProduct(id);
  if (result.success) revalidatePath("/vendor/products");
  return result;
}
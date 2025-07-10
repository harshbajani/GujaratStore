"use server";

import { DropdownService } from "@/services/dropdown.service";

export async function getAllDropdownData() {
  return await DropdownService.getAllDropdownData();
}

export async function prewarmDropdownCache() {
  return await DropdownService.prewarmCache();
}

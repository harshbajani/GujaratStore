import { getCurrentVendor } from "@/lib/actions/vendor.actions";
import { NextResponse } from "next/server";

export async function GET() {
  const result = await getCurrentVendor();
  return NextResponse.json(result);
}

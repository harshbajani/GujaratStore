import { NextResponse } from "next/server";
import { getAllAttributes } from "@/lib/actions/attribute.actions";

export async function GET() {
  const result = await getAllAttributes();
  return NextResponse.json(result);
}

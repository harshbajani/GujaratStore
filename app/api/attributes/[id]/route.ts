import { NextRequest, NextResponse } from "next/server";
import { getAttributeById } from "@/lib/actions/attribute.actions";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = (await params).id;
  const result = await getAttributeById(id);
  return NextResponse.json(result);
}

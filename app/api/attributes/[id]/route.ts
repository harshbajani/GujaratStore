import { NextRequest, NextResponse } from "next/server";
import { getAttributeById } from "@/lib/actions/attribute.actions";
import { RouteParams } from "@/types";

export async function GET(request: NextRequest, { params }: RouteParams) {
  const id = (await params).id;
  const result = await getAttributeById(id);
  return NextResponse.json(result);
}

// app/api/admin/vendor/[id]/route.ts
import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import {
  getVendorById,
  updateVendorById,
  deleteVendor,
} from "@/lib/actions/admin/vendor.actions";
import { RouteParams } from "@/types";

// GET /api/admin/vendor/[id]
export async function GET(request: Request, { params }: RouteParams) {
  await connectToDB();
  const id = (await params).id;

  const result = await getVendorById(id);
  if (result.success) {
    return NextResponse.json(result, { status: 200 });
  } else {
    return NextResponse.json(result, { status: 404 });
  }
}

// PUT /api/admin/vendor/[id]
export async function PUT(request: Request, { params }: RouteParams) {
  await connectToDB();
  const id = (await params).id;
  const data = await request.json();

  const result = await updateVendorById(id, data);
  if (result.success) {
    return NextResponse.json(result, { status: 200 });
  } else {
    return NextResponse.json(result, { status: 400 });
  }
}

// DELETE /api/admin/vendor/[id]
export async function DELETE(request: Request, { params }: RouteParams) {
  await connectToDB();
  const id = (await params).id;

  const result = await deleteVendor(id);
  if (result.success) {
    return NextResponse.json(result, { status: 200 });
  } else {
    return NextResponse.json(result, { status: 400 });
  }
}

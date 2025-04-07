// app/api/admin/vendor/[id]/route.ts
import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import {
  getVendorById,
  updateVendorById,
  deleteVendor,
} from "@/lib/actions/admin/vendor.actions";

// GET /api/admin/vendor/[id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  await connectToDB();

  const result = await getVendorById(id);
  if (result.success) {
    return NextResponse.json(result, { status: 200 });
  } else {
    return NextResponse.json(result, { status: 404 });
  }
}

// PUT /api/admin/vendor/[id]
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  await connectToDB();
  const { id } = params;
  const data = await request.json();

  const result = await updateVendorById(id, data);
  if (result.success) {
    return NextResponse.json(result, { status: 200 });
  } else {
    return NextResponse.json(result, { status: 400 });
  }
}

// DELETE /api/admin/vendor/[id]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  await connectToDB();
  const { id } = params;

  const result = await deleteVendor(id);
  if (result.success) {
    return NextResponse.json(result, { status: 200 });
  } else {
    return NextResponse.json(result, { status: 400 });
  }
}

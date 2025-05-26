// app/api/admin/vendor/[id]/route.ts
import { NextResponse } from "next/server";
import { VendorService } from "@/services/vendor.service";

// GET /api/admin/vendor/[id]
export async function GET(request: Request, { params }: RouteParams) {
  const id = (await params).id;
  const result = await VendorService.getVendorById(id);

  if (result.success) {
    return NextResponse.json(result, { status: 200 });
  } else {
    return NextResponse.json(result, { status: 404 });
  }
}

// PUT /api/admin/vendor/[id]
export async function PUT(request: Request, { params }: RouteParams) {
  const id = (await params).id;
  const data = await request.json();

  const result = await VendorService.updateVendor(id, data);

  if (result.success) {
    return NextResponse.json(result, { status: 200 });
  } else {
    return NextResponse.json(result, { status: 400 });
  }
}

// DELETE /api/admin/vendor/[id]
export async function DELETE(request: Request, { params }: RouteParams) {
  const id = (await params).id;
  const result = await VendorService.deleteVendor(id);

  if (result.success) {
    return NextResponse.json(result, { status: 200 });
  } else {
    return NextResponse.json(result, { status: 400 });
  }
}

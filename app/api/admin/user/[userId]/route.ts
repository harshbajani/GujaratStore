import { getUserById } from "@/lib/actions/admin/user.actions";

import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: RouteParams) {
  const { userId } = await params;
  const response = await getUserById(userId);
  if (!response.success) {
    return NextResponse.json(response, { status: 404 });
  }
  return NextResponse.json(response);
}

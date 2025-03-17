import { getUserById } from "@/lib/actions/user.actions";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const userId = await params;
  const response = await getUserById(userId.userId);
  if (!response.success) {
    return NextResponse.json(response, { status: 404 });
  }
  return NextResponse.json(response);
}

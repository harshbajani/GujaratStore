import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/actions/user.actions";

export async function GET() {
  const result = await getCurrentUser();
  return NextResponse.json(result);
}

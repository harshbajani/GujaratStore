import { getUserById } from "@/lib/actions/user.actions";
import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await params;
    const response = await getUserById(userId);

    if (!response.success) {
      return NextResponse.json(response, { status: 404 });
    }

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "An error occurred",
      },
      { status: 500 }
    );
  }
}

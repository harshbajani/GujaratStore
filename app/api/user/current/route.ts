import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/actions/user.actions";
import { connectToDB } from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/auth";
import { IUser } from "@/types";
import User from "@/lib/models/user.model";

export async function GET() {
  const result = await getCurrentUser();
  return NextResponse.json(result);
}

export async function PATCH(request: NextRequest) {
  try {
    await connectToDB();

    // Get the current user from the session
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const updateFields: Partial<IUser> = {};

    // Only allow specific fields to be updated
    if (body.referralUsed !== undefined) {
      updateFields.referralUsed = body.referralUsed;
    }

    // Update the user
    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      { $set: updateFields },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        referralUsed: updatedUser.referralUsed,
      },
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

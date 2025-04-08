// /app/api/admin/user/route.ts
import User from "@/lib/models/user.model";
import { connectToDB } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Parse the query string to see if an ID is provided
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  try {
    // Connect to the database
    await connectToDB();

    if (id) {
      // If an id is provided, fetch a single user by id
      const user = await User.findById(id);
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      return NextResponse.json(user, { status: 200 });
    } else {
      // Otherwise, fetch all users
      const users = await User.find({});
      return NextResponse.json(users, { status: 200 });
    }
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

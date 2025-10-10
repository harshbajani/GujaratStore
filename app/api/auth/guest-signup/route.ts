import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import User from "@/lib/models/user.model";
import { inngest } from "@/lib/inngest/client";

export async function POST(request: Request) {
  try {
    const { name, email, phone, password } = await request.json();

    await connectToDB();

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingUser) {
      return NextResponse.json({
        success: false,
        message: "An account with this email or phone already exists",
      });
    }

    // Create new user
    const newUser = await User.create({
      name,
      email,
      phone,
      password,
      role: "user",
      isVerified: true, // Auto-verify guest users
    });

    // Enqueue emails in background via Inngest
    try {
      await Promise.all([
        inngest.send({
          name: "app/user.welcome",
          data: { email, name },
        }),
        inngest.send({
          name: "app/user.guest_password_issued",
          data: { email, name, password },
        }),
      ]);
      console.log(
        `Queued welcome and temporary password emails for ${email}`
      );
    } catch (emailError) {
      console.error("Failed to enqueue email events:", emailError);
      // Don't fail the user creation if enqueue fails
    }

    return NextResponse.json({
      success: true,
      message: "Account created successfully",
      data: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error("Guest signup error:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to create account",
    });
  }
}

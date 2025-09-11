import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import User from "@/lib/models/user.model";
import { sendWelcomeEmail } from "@/lib/workflows/emails";

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

    // Send welcome email with credentials
    await sendWelcomeEmail({
      email,
      name,
      password,
    });

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

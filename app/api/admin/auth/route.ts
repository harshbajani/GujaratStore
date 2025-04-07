import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Get admin credentials from environment variables
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const jwtSecret =
      process.env.JWT_SECRET || "gujarat_store_admin_secret_key_2025_secure";

    // Validate credentials
    if (!adminUsername || !adminPassword) {
      return NextResponse.json(
        { success: false, message: "Admin credentials not configured" },
        { status: 500 }
      );
    }

    // Check if credentials match
    if (username === adminUsername && password === adminPassword) {
      // Generate JWT token
      const token = jwt.sign({ username, role: "admin" }, jwtSecret, {
        expiresIn: "1d",
      });

      // Set cookie using Next.js cookies API
      const cookieStore = await cookies();
      cookieStore.set({
        name: "admin_auth_token",
        value: token,
        httpOnly: true,
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24, // 1 day in seconds
        sameSite: "lax",
      });

      return NextResponse.json(
        { success: true, message: "Authentication successful" },
        { status: 200 }
      );
    }

    // Invalid credentials
    return NextResponse.json(
      { success: false, message: "Invalid credentials" },
      { status: 401 }
    );
  } catch (error) {
    console.error("Admin auth error:", error);
    return NextResponse.json(
      { success: false, message: "Authentication failed" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  // Clear the authentication cookie
  const cookieStore = await cookies();
  cookieStore.delete("admin_auth_token");

  return NextResponse.json(
    { success: true, message: "Logged out successfully" },
    { status: 200 }
  );
}

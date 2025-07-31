/* eslint-disable @typescript-eslint/no-explicit-any */
import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../nextAuthConfig";

// Admin-only authentication middleware
export function withAdminAuth(
  handler: (
    request: NextRequest,
    ...args: any[]
  ) => Promise<NextResponse> | NextResponse
) {
  return async (request: NextRequest, ...args: any[]) => {
    try {
      // Get the admin auth token from cookies
      const adminAuthToken = request.cookies.get("admin_auth_token")?.value;

      if (!adminAuthToken) {
        return NextResponse.json(
          {
            success: false,
            error: "Unauthorized - Admin authentication required",
          },
          { status: 401 }
        );
      }

      // Verify the JWT token
      const jwtSecret =
        process.env.JWT_SECRET || "gujarat_store_admin_secret_key_2025_secure";

      try {
        const decoded = jwt.verify(adminAuthToken, jwtSecret) as any;

        // Check if the role is admin
        if (decoded.role !== "admin") {
          return NextResponse.json(
            { success: false, error: "Forbidden - Admin role required" },
            { status: 403 }
          );
        }

        // Add admin info to request for downstream use
        (request as any).admin = decoded;
      } catch {
        return NextResponse.json(
          { success: false, error: "Invalid or expired admin token" },
          { status: 401 }
        );
      }

      // Call the original handler
      return handler(request, ...args);
    } catch (error) {
      console.error("Admin auth middleware error:", error);
      return NextResponse.json(
        { success: false, error: "Authentication error" },
        { status: 500 }
      );
    }
  };
}

// Admin OR Vendor authentication middleware
export function withAdminOrVendorAuth(
  handler: (
    request: NextRequest,
    ...args: any[]
  ) => Promise<NextResponse> | NextResponse
) {
  return async (request: NextRequest, ...args: any[]) => {
    try {
      // First, try admin authentication
      const adminAuthToken = request.cookies.get("admin_auth_token")?.value;

      if (adminAuthToken) {
        // Verify admin JWT token
        const jwtSecret =
          process.env.JWT_SECRET ||
          "gujarat_store_admin_secret_key_2025_secure";

        try {
          const decoded = jwt.verify(adminAuthToken, jwtSecret) as any;

          if (decoded.role === "admin") {
            // Add admin info to request
            (request as any).user = { ...decoded, type: "admin" };
            return handler(request, ...args);
          }
        } catch {
          // Admin token invalid, continue to check vendor auth
        }
      }

      // If no valid admin token, try vendor/user authentication via NextAuth
      try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
          return NextResponse.json(
            { success: false, error: "Unauthorized - Authentication required" },
            { status: 401 }
          );
        }

        // Check if user is vendor or user (both allowed for shared routes)
        if (session.user.role !== "vendor" && session.user.role !== "user") {
          return NextResponse.json(
            {
              success: false,
              error: "Forbidden - Vendor or Admin access required",
            },
            { status: 403 }
          );
        }

        // Add session info to request
        (request as any).user = {
          ...session.user,
          type: "nextauth",
          role: session.user.role,
        };

        return handler(request, ...args);
      } catch {
        return NextResponse.json(
          { success: false, error: "Authentication failed" },
          { status: 401 }
        );
      }
    } catch (error) {
      console.error("Auth middleware error:", error);
      return NextResponse.json(
        { success: false, error: "Authentication error" },
        { status: 500 }
      );
    }
  };
}

import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Get the pathname
  const path = request.nextUrl.pathname;

  // Define public routes that should be skipped
  const isPublicRoute =
    path.includes("/vendor/sign-in") ||
    path.includes("/vendor/sign-up") ||
    path.includes("/vendor/forgot-password") ||
    path.includes("/vendor/reset-password") ||
    path.includes("/vendor/account");

  // Skip middleware for public routes
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Only run store check for protected vendor routes
  if (path.startsWith("/vendor")) {
    // Get the token
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // Check if user is authenticated and is a vendor
    if (!token || token.role !== "vendor") {
      return NextResponse.redirect(new URL("/vendor/sign-in", request.url));
    }

    try {
      // Make a request to your API to check if store exists
      const response = await fetch(
        `${request.nextUrl.origin}/api/vendor/store`,
        {
          headers: {
            Cookie: request.headers.get("cookie") || "",
          },
        }
      );

      const data = await response.json();

      // If no store exists, redirect to account page
      if (!data.success || !data.data) {
        return NextResponse.redirect(new URL("/vendor/account", request.url));
      }
    } catch {
      // If there's an error checking store, redirect to account page
      return NextResponse.redirect(new URL("/vendor/account", request.url));
    }
  }

  if (path.startsWith("/admin")) {
    // Check if admin auth cookie exists
    const adminAuthCookie = request.cookies.get("admin_auth_token");

    // If accessing admin routes without auth cookie, redirect to login
    if (!adminAuthCookie && path !== "/admin/sign-in") {
      return NextResponse.redirect(new URL("/admin/sign-in", request.url));
    }

    // If already authenticated and trying to access login page, redirect to admin dashboard
    if (adminAuthCookie && path === "/admin/sign-in") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  matcher: ["/vendor/:path*", "/admin/:path*"],
};

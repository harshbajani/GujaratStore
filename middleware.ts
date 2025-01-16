import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

const secret = process.env.NEXTAUTH_SECRET;

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Apply middleware only for the /app/vendor route
  if (pathname.startsWith("/app/vendor")) {
    // Define public paths for vendor
    const publicPaths = [
      "/app/vendor/sign-in",
      "/app/vendor/sign-up",
      "/app/vendor/forgot-password",
      "/app/vendor/reset-password",
    ];

    // Get the token from the request
    const token = await getToken({ req, secret });

    // If there's no token and the path is not public, redirect to sign-in
    if (!token) {
      if (!publicPaths.includes(pathname)) {
        return NextResponse.redirect(new URL("/app/vendor/sign-in", req.url));
      }
      return NextResponse.next();
    }

    // Handle authenticated users
    if (token) {
      // If user is trying to access vendor routes but is not a vendor
      if (!publicPaths.includes(pathname) && token.role !== "vendor") {
        // Redirect to unauthorized page or home
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }

      // Prevent authenticated users from accessing auth pages (sign-in, sign-up, etc.)
      if (publicPaths.includes(pathname)) {
        return NextResponse.redirect(new URL("/app/vendor/dashboard", req.url));
      }
    }
  }

  // Allow the request to proceed for all other routes
  return NextResponse.next();
}

// Add config to specify which routes should be processed by the middleware
export const config = {
  matcher: [
    // Match all paths under /app/vendor
    "/app/vendor/:path*",
  ],
};

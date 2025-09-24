import { NextResponse } from "next/server";
import {
  cleanupUserOrders,
  cleanupAllUsersOrders,
} from "@/lib/actions/cleanup.actions";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const result = await cleanupUserOrders();

    return NextResponse.json(result, {
      status: result.success ? 200 : 400,
    });
  } catch (error) {
    console.error("Cleanup user orders API error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to cleanup orders",
      },
      { status: 500 }
    );
  }
}

// Admin-only endpoint to clean up all users' orders
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    // Add admin role check here if you have role-based access
    // For now, this is just a protection against accidental usage
    const body = await request.json();
    if (body.confirmAction !== "CLEANUP_ALL_USERS_ORDERS_CONFIRMED") {
      return NextResponse.json(
        { success: false, message: "Action confirmation required" },
        { status: 400 }
      );
    }

    const result = await cleanupAllUsersOrders();

    return NextResponse.json(result, {
      status: result.success ? 200 : 400,
    });
  } catch (error) {
    console.error("Cleanup all users orders API error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to cleanup all orders",
      },
      { status: 500 }
    );
  }
}

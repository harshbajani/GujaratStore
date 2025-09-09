import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import { connectToDB } from "@/lib/mongodb";
import Vendor from "@/lib/models/vendor.model";

export async function GET() {
  try {
    await connectToDB();

    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const vendor = (await Vendor.findOne({
      email: session.user.email,
    }).lean()) as IVendor | null;

    if (!vendor) {
      return NextResponse.json(
        { success: false, error: "Vendor not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        isVerified: vendor.isVerified,
        emailVerified: vendor.emailVerified,
        hasStore: !!vendor.store,
        hasBankDetails: !!vendor.bankDetails,
        hasIdentity: !!vendor.vendorIdentity,
        hasBusinessIdentity: !!vendor.businessIdentity,
      },
    });
  } catch (error) {
    console.error("Vendor verification check error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

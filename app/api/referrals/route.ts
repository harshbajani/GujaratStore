import { ReferralService } from "@/services/referral.service";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentVendor } from "@/lib/actions/vendor.actions";
import { connectToDB } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  await connectToDB();
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const code = searchParams.get("code");

    // Check for pagination parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const usePagination = searchParams.get("paginated") === "true";

    if (id) {
      const result = await ReferralService.getReferralById(id);
      return NextResponse.json(result);
    }

    if (code) {
      const result = await ReferralService.getReferralByCode(code);
      return NextResponse.json(result);
    }

    const vendorResponse = await getCurrentVendor();
    if (!vendorResponse.success) {
      return NextResponse.json(
        { success: false, message: "Not authenticated as vendor" },
        { status: 401 }
      );
    }

    if (usePagination) {
      // Use paginated version
      const result = await ReferralService.getReferralsByVendorPaginated(
        vendorResponse.data?._id,
        {
          page,
          limit,
          search,
          sortBy,
          sortOrder: sortOrder as "asc" | "desc",
        }
      );
      return NextResponse.json(result);
    } else {
      // Use legacy version for backward compatibility
      const result = await ReferralService.getReferralsByVendor(
        vendorResponse.data?._id
      );
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error("GET referrals error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  await connectToDB();
  try {
    const body = await request.json();
    const result = await ReferralService.createReferral(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error("POST referral error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  await connectToDB();
  try {
    const body = await request.json();

    // Get current vendor for authorization
    const vendorResponse = await getCurrentVendor();
    if (!vendorResponse.success) {
      return NextResponse.json(
        { success: false, message: "Not authenticated as vendor" },
        { status: 401 }
      );
    }

    // Check if the referral belongs to the vendor
    const referral = await ReferralService.getReferralById(body._id);
    if (
      !referral.success ||
      referral.data?.vendorId !== vendorResponse.data?._id
    ) {
      return NextResponse.json(
        { success: false, message: "Unauthorized to update this referral" },
        { status: 403 }
      );
    }

    const result = await ReferralService.updateReferral(body._id, body);
    return NextResponse.json(result);
  } catch (error) {
    console.error("PUT referral error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  await connectToDB();
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Referral ID is required" },
        { status: 400 }
      );
    }

    // Get current vendor for authorization
    const vendorResponse = await getCurrentVendor();
    if (!vendorResponse.success) {
      return NextResponse.json(
        { success: false, message: "Not authenticated as vendor" },
        { status: 401 }
      );
    }

    // Check if the referral belongs to the vendor
    const referral = await ReferralService.getReferralById(id);
    if (
      !referral.success ||
      referral.data?.vendorId !== vendorResponse.data?._id
    ) {
      return NextResponse.json(
        { success: false, message: "Unauthorized to delete this referral" },
        { status: 403 }
      );
    }

    const result = await ReferralService.deleteReferral(id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("DELETE referral error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  await connectToDB();
  try {
    const body = await request.json();
    const result = await ReferralService.applyReferral(body.code, body.userId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("PATCH referral error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

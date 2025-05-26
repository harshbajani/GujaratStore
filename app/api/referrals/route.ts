import { ReferralService } from "@/services/referral.service";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentVendor } from "@/lib/actions/vendor.actions";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const code = searchParams.get("code");

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

    const result = await ReferralService.getReferralsByVendor(
      vendorResponse.data?._id
    );
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET referrals error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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

export async function PATCH(request: Request) {
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

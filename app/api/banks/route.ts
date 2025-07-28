import { NextRequest, NextResponse } from "next/server";
import {
  getAllBanks,
  searchBanks,
  validateIFSCCode,
  getBankFromIFSC,
} from "@/lib/actions/bank.actions";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("search");
    const ifsc = searchParams.get("ifsc");
    const validate = searchParams.get("validate");

    let result;

    // IFSC validation endpoint
    if (validate && ifsc) {
      result = await validateIFSCCode(ifsc.toUpperCase());

      if (result.success) {
        return NextResponse.json({
          success: true,
          data: result.data,
          message: result.message,
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            message: result.message,
          },
          { status: 400 }
        );
      }
    }

    // Get bank details from IFSC
    if (ifsc && !validate) {
      result = await getBankFromIFSC(ifsc.toUpperCase());

      if (result.success) {
        return NextResponse.json({
          success: true,
          data: result.data,
          message: result.message,
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            message: result.message,
          },
          { status: 400 }
        );
      }
    }

    // Search or get all banks
    if (query && query.trim().length >= 2) {
      result = await searchBanks(query);
    } else {
      result = await getAllBanks();
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data,
        message: result.message,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: result.message,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Banks API error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

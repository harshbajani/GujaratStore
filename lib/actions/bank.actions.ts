"use server";

import { BankService } from "@/services/bank.service";
import { VendorService } from "@/services/vendor.service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";

/**
 * Get all banks
 */
export async function getAllBanks(): Promise<ActionResponse<Bank[]>> {
  try {
    return await BankService.getAllBanks();
  } catch (error) {
    console.error("Get all banks action error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch banks",
    };
  }
}

/**
 * Search banks by query
 */
export async function searchBanks(
  query: string
): Promise<ActionResponse<Bank[]>> {
  try {
    if (!query || query.trim().length < 2) {
      return {
        success: false,
        message: "Search query must be at least 2 characters",
      };
    }

    return await BankService.searchBanks(query.trim());
  } catch (error) {
    console.error("Search banks action error:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to search banks",
    };
  }
}

/**
 * Get bank by code
 */
export async function getBankByCode(
  bankCode: string
): Promise<ActionResponse<Bank>> {
  try {
    if (!bankCode) {
      return {
        success: false,
        message: "Bank code is required",
      };
    }

    return await BankService.getBankByCode(bankCode);
  } catch (error) {
    console.error("Get bank by code action error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch bank",
    };
  }
}

/**
 * Validate IFSC code using API
 */
export async function validateIFSCCode(
  ifscCode: string
): Promise<ActionResponse<BankBranchDetails>> {
  try {
    if (!ifscCode) {
      return {
        success: false,
        message: "IFSC code is required",
      };
    }

    // Basic format validation
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode)) {
      return {
        success: false,
        message: "Invalid IFSC code format",
      };
    }

    return await BankService.validateIFSC(ifscCode);
  } catch (error) {
    console.error("Validate IFSC action error:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to validate IFSC code",
    };
  }
}

/**
 * Get bank details from IFSC code
 */
export async function getBankFromIFSC(
  ifscCode: string
): Promise<ActionResponse<Bank>> {
  try {
    if (!ifscCode) {
      return {
        success: false,
        message: "IFSC code is required",
      };
    }

    return await BankService.getBankFromIFSC(ifscCode);
  } catch (error) {
    console.error("Get bank from IFSC action error:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to get bank details",
    };
  }
}

/**
 * Update vendor bank details with enhanced validation
 */
export async function updateVendorBankDetails(
  bankDetails: BankDetails
): Promise<ActionResponse<VendorResponse>> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return {
        success: false,
        message: "Unauthorized",
      };
    }

    // Validate required fields
    const requiredFields = [
      "bankName",
      "bankCode",
      "ifscCode",
      "accountHolderName",
      "accountNumber",
      "accountType",
    ];

    for (const field of requiredFields) {
      if (!bankDetails[field as keyof BankDetails]) {
        return {
          success: false,
          message: `${field} is required`,
        };
      }
    }

    // Enhanced IFSC validation using API
    const ifscValidation = await validateIFSCCode(bankDetails.ifscCode);
    if (!ifscValidation.success) {
      return {
        success: false,
        message: `Invalid IFSC code: ${ifscValidation.message}`,
      };
    }

    // Validate account type
    if (!["savings", "current"].includes(bankDetails.accountType)) {
      return {
        success: false,
        message: "Account type must be either 'savings' or 'current'",
      };
    }

    // Cross-validate bank name with IFSC
    if (ifscValidation.data) {
      const apiBankName = ifscValidation.data.BANK.toLowerCase().trim();
      const providedBankName = bankDetails.bankName.toLowerCase().trim();

      // Check if the provided bank name is reasonably similar to API response
      if (
        !apiBankName.includes(providedBankName.split(" ")[0]) &&
        !providedBankName.includes(apiBankName.split(" ")[0])
      ) {
        console.warn(
          `Bank name mismatch: Provided "${bankDetails.bankName}", API returned "${ifscValidation.data.BANK}"`
        );
      }

      // Update bank name with the accurate one from API
      bankDetails.bankName = ifscValidation.data.BANK;
    }

    // Update vendor with bank details
    const updateResult = await VendorService.updateVendor(
      session.user.id,
      { bankDetails },
      session.user.email
    );

    return updateResult;
  } catch (error) {
    console.error("Update vendor bank details action error:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update bank details",
    };
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { CacheService } from "./cache.service";

export class BankService {
  private static readonly CACHE_PREFIX = "banks:";
  private static readonly CACHE_TTL = 86400; // 24 hours
  private static readonly RAZORPAY_IFSC_API = "https://ifsc.razorpay.com";

  // Fallback list of major Indian banks (kept as backup)
  private static readonly FALLBACK_BANKS: Bank[] = [
    { bankCode: "SBI", bankName: "State Bank of India", ifscPrefix: "SBIN" },
    { bankCode: "HDFC", bankName: "HDFC Bank", ifscPrefix: "HDFC" },
    { bankCode: "ICICI", bankName: "ICICI Bank", ifscPrefix: "ICIC" },
    { bankCode: "AXIS", bankName: "Axis Bank", ifscPrefix: "UTIB" },
    { bankCode: "KOTAK", bankName: "Kotak Mahindra Bank", ifscPrefix: "KKBK" },
    { bankCode: "YES", bankName: "Yes Bank", ifscPrefix: "YESB" },
    { bankCode: "IDFC", bankName: "IDFC First Bank", ifscPrefix: "IDFB" },
    { bankCode: "PNB", bankName: "Punjab National Bank", ifscPrefix: "PUNB" },
    { bankCode: "BOB", bankName: "Bank of Baroda", ifscPrefix: "BARB" },
    { bankCode: "CANARA", bankName: "Canara Bank", ifscPrefix: "CNRB" },
    { bankCode: "UNION", bankName: "Union Bank of India", ifscPrefix: "UBIN" },
    { bankCode: "INDIAN", bankName: "Indian Bank", ifscPrefix: "IDIB" },
    { bankCode: "BOI", bankName: "Bank of India", ifscPrefix: "BKID" },
    {
      bankCode: "CENTRAL",
      bankName: "Central Bank of India",
      ifscPrefix: "CBIN",
    },
    {
      bankCode: "INDIAN_OVERSEAS",
      bankName: "Indian Overseas Bank",
      ifscPrefix: "IOBA",
    },
    { bankCode: "UCO", bankName: "UCO Bank", ifscPrefix: "UCBA" },
    { bankCode: "BANDHAN", bankName: "Bandhan Bank", ifscPrefix: "BDBL" },
    { bankCode: "FEDERAL", bankName: "Federal Bank", ifscPrefix: "FDRL" },
    {
      bankCode: "SOUTH_INDIAN",
      bankName: "South Indian Bank",
      ifscPrefix: "SIBL",
    },
    {
      bankCode: "KARUR_VYSYA",
      bankName: "Karur Vysya Bank",
      ifscPrefix: "KVBL",
    },
    { bankCode: "CITY_UNION", bankName: "City Union Bank", ifscPrefix: "CIUB" },
    { bankCode: "INDUSIND", bankName: "IndusInd Bank", ifscPrefix: "INDB" },
    { bankCode: "RBL", bankName: "RBL Bank", ifscPrefix: "RATN" },
    {
      bankCode: "JAMMU_KASHMIR",
      bankName: "Jammu & Kashmir Bank",
      ifscPrefix: "JAKA",
    },
    { bankCode: "DCB", bankName: "DCB Bank", ifscPrefix: "DCBL" },
    { bankCode: "NAINITAL", bankName: "Nainital Bank", ifscPrefix: "NTBL" },
    {
      bankCode: "TAMILNAD_MERCANTILE",
      bankName: "Tamilnad Mercantile Bank",
      ifscPrefix: "TMBL",
    },
    { bankCode: "DHANLAXMI", bankName: "Dhanlaxmi Bank", ifscPrefix: "DLXB" },
  ];

  private static getCacheKey(suffix: string = "all") {
    return `${this.CACHE_PREFIX}${suffix}`;
  }

  /**
   * Validate IFSC code using Razorpay API
   */
  static async validateIFSC(
    ifscCode: string
  ): Promise<ActionResponse<BankBranchDetails>> {
    try {
      const cacheKey = this.getCacheKey(`ifsc:${ifscCode}`);
      const cachedData = await CacheService.get<BankBranchDetails>(cacheKey);

      if (cachedData) {
        return {
          success: true,
          message: "IFSC details retrieved from cache",
          data: cachedData,
        };
      }

      const response = await fetch(`${this.RAZORPAY_IFSC_API}/${ifscCode}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        return {
          success: false,
          message:
            response.status === 404
              ? "Invalid IFSC code"
              : "Failed to validate IFSC code",
        };
      }

      const bankDetails: BankBranchDetails = await response.json();

      // Cache the result
      await CacheService.set(cacheKey, bankDetails, this.CACHE_TTL);

      return {
        success: true,
        message: "IFSC code validated successfully",
        data: bankDetails,
      };
    } catch (error) {
      console.error("IFSC validation error:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to validate IFSC code",
      };
    }
  }

  /**
   * Get bank details from IFSC code
   */
  static async getBankFromIFSC(
    ifscCode: string
  ): Promise<ActionResponse<Bank>> {
    try {
      const validationResult = await this.validateIFSC(ifscCode);

      if (!validationResult.success || !validationResult.data) {
        return {
          success: false,
          message: validationResult.message || "Failed to get bank details",
        };
      }

      const bankDetails = validationResult.data;
      const ifscPrefix = ifscCode.substring(0, 4);

      const bank: Bank = {
        bankCode: ifscPrefix,
        bankName: bankDetails.BANK,
        ifscPrefix: ifscPrefix,
      };

      return {
        success: true,
        message: "Bank details retrieved successfully",
        data: bank,
      };
    } catch (error) {
      console.error("Get bank from IFSC error:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to get bank details",
      };
    }
  }

  /**
   * Get all Indian banks (API + fallback)
   */
  static async getAllBanks(): Promise<ActionResponse<Bank[]>> {
    try {
      const cacheKey = this.getCacheKey();
      const cachedData = await CacheService.get<Bank[]>(cacheKey);

      if (cachedData) {
        return {
          success: true,
          message: "Banks retrieved from cache",
          data: cachedData,
        };
      }

      // Try to get updated bank list from various sources
      let banks: Bank[] = [];

      try {
        // You can implement API calls to get comprehensive bank lists
        // For now, using the fallback list with enhanced data
        banks = await this.getEnhancedBankList();
      } catch (apiError) {
        console.warn("API fetch failed, using fallback list:", apiError);
        banks = [...this.FALLBACK_BANKS];
      }

      // Sort banks alphabetically
      banks.sort((a, b) => a.bankName.localeCompare(b.bankName));

      // Cache the result
      await CacheService.set(cacheKey, banks, this.CACHE_TTL);

      return {
        success: true,
        message: "Banks retrieved successfully",
        data: banks,
      };
    } catch (error) {
      console.error("Get banks error:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to fetch banks",
      };
    }
  }

  /**
   * Enhanced bank list with validation
   */
  private static async getEnhancedBankList(): Promise<Bank[]> {
    const enhancedBanks: Bank[] = [];

    // Validate each bank's IFSC prefix by testing with a sample IFSC
    for (const bank of this.FALLBACK_BANKS) {
      try {
        // Test with a sample IFSC code (first 4 chars + 0 + 6 sample digits)
        const sampleIFSC = `${bank.ifscPrefix}0000001`;
        const validationResult = await this.validateIFSC(sampleIFSC);

        if (validationResult.success && validationResult.data) {
          // Use the bank name from API if available
          enhancedBanks.push({
            ...bank,
            bankName: validationResult.data.BANK || bank.bankName,
          });
        } else {
          // Keep the original bank info if API validation fails
          enhancedBanks.push(bank);
        }
      } catch {
        // If validation fails, include the original bank info
        enhancedBanks.push(bank);
      }
    }

    return enhancedBanks;
  }

  /**
   * Search banks by name or code
   */
  static async searchBanks(query: string): Promise<ActionResponse<Bank[]>> {
    try {
      const allBanksResult = await this.getAllBanks();

      if (!allBanksResult.success || !allBanksResult.data) {
        return allBanksResult;
      }

      const filteredBanks = allBanksResult.data.filter(
        (bank) =>
          bank.bankName.toLowerCase().includes(query.toLowerCase()) ||
          bank.bankCode.toLowerCase().includes(query.toLowerCase()) ||
          bank.ifscPrefix.toLowerCase().includes(query.toLowerCase())
      );

      return {
        success: true,
        message: "Banks searched successfully",
        data: filteredBanks,
      };
    } catch (error) {
      console.error("Search banks error:", error);
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
  static async getBankByCode(bankCode: string): Promise<ActionResponse<Bank>> {
    try {
      const allBanksResult = await this.getAllBanks();

      if (!allBanksResult.success || !allBanksResult.data) {
        return {
          success: false,
          message: "Failed to fetch banks",
        };
      }

      const bank = allBanksResult.data.find(
        (b) => b.bankCode === bankCode || b.ifscPrefix === bankCode
      );

      if (!bank) {
        return {
          success: false,
          message: "Bank not found",
        };
      }

      return {
        success: true,
        message: "Bank retrieved successfully",
        data: bank,
      };
    } catch (error) {
      console.error("Get bank by code error:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to fetch bank",
      };
    }
  }

  /**
   * Auto-complete IFSC code based on bank selection
   */
  static generateIFSCTemplate(bankCode: string): string {
    const bank = this.FALLBACK_BANKS.find((b) => b.bankCode === bankCode);
    return bank ? `${bank.ifscPrefix}0` : "";
  }
}

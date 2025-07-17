/* eslint-disable @typescript-eslint/no-explicit-any */
import { connectToDB } from "@/lib/mongodb";
import Referral from "@/lib/models/referral.model";
import User from "@/lib/models/user.model";
import { CacheService } from "./cache.service";

export class ReferralService {
  private static CACHE_TTL = 300; // 5 minutes

  private static getCacheKey(key: string) {
    return `referrals:${key}`;
  }

  private static listCacheKey(vendorId: string) {
    return `referrals:list:${vendorId}`;
  }

  // New paginated method for getting referrals by vendor
  static async getReferralsByVendorPaginated(
    vendorId: string,
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<IReferralResponse>> {
    try {
      await connectToDB();

      const {
        page = 1,
        limit = 10,
        search = "",
        sortBy = "createdAt",
        sortOrder = "desc",
      } = params;

      // Create cache key based on all parameters
      const cacheKey = this.getCacheKey(
        `paginated:${vendorId}:${page}:${limit}:${search}:${sortBy}:${sortOrder}`
      );

      const cached = await CacheService.get<
        PaginatedResponse<IReferralResponse>
      >(cacheKey);
      if (cached) {
        return cached;
      }

      // Build query for search
      const query: any = { vendorId };
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { code: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ];
      }

      // Build sort object
      const sort: any = {};
      sort[sortBy] = sortOrder === "desc" ? -1 : 1;

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute queries in parallel
      const [referrals, totalCount] = await Promise.all([
        Referral.find(query)
          .populate("createdBy", "name email")
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        Referral.countDocuments(query),
      ]);

      const transformedReferrals = referrals.map(this.transformReferral);

      const totalPages = Math.ceil(totalCount / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      const result: PaginatedResponse<IReferralResponse> = {
        success: true,
        data: transformedReferrals,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: totalCount,
          itemsPerPage: limit,
          hasNext,
          hasPrev,
        },
      };

      // Cache the result
      await CacheService.set(cacheKey, result, this.CACHE_TTL);

      return result;
    } catch (error) {
      console.error("Get referrals paginated error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch referrals",
      };
    }
  }

  // New paginated method for admin to get all referrals
  static async getAllReferralsPaginated(
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<IReferralResponse>> {
    try {
      await connectToDB();

      const {
        page = 1,
        limit = 10,
        search = "",
        sortBy = "createdAt",
        sortOrder = "desc",
      } = params;

      // Create cache key based on all parameters
      const cacheKey = this.getCacheKey(
        `admin:paginated:${page}:${limit}:${search}:${sortBy}:${sortOrder}`
      );

      const cached = await CacheService.get<
        PaginatedResponse<IReferralResponse>
      >(cacheKey);
      if (cached) {
        return cached;
      }

      // Build query for search
      const query: any = {};
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { code: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ];
      }

      // Build sort object
      const sort: any = {};
      sort[sortBy] = sortOrder === "desc" ? -1 : 1;

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute queries in parallel
      const [referrals, totalCount] = await Promise.all([
        Referral.find(query)
          .populate("createdBy", "name email")
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        Referral.countDocuments(query),
      ]);

      const transformedReferrals = referrals.map(this.transformReferral);

      const totalPages = Math.ceil(totalCount / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      const result: PaginatedResponse<IReferralResponse> = {
        success: true,
        data: transformedReferrals,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: totalCount,
          itemsPerPage: limit,
          hasNext,
          hasPrev,
        },
      };

      // Cache the result
      await CacheService.set(cacheKey, result, this.CACHE_TTL);

      return result;
    } catch (error) {
      console.error("Get all referrals paginated error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch referrals",
      };
    }
  }

  // Keep original method for backward compatibility
  static async getReferralsByVendor(
    vendorId: string
  ): Promise<ActionResponse<IReferralResponse[]>> {
    try {
      await connectToDB();

      const key = this.listCacheKey(vendorId);
      const cached = await CacheService.get<IReferralResponse[]>(key);
      if (cached) {
        return { success: true, message: "From cache", data: cached };
      }

      const referrals = await Referral.find({ vendorId })
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 })
        .lean();

      const list = referrals.map(this.transformReferral);
      await CacheService.set(key, list, this.CACHE_TTL);

      return {
        success: true,
        message: "Referrals retrieved successfully",
        data: list,
      };
    } catch (error) {
      console.error("Get referrals error:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to fetch referrals",
      };
    }
  }

  // Keep original method for backward compatibility
  static async getAllReferralsLegacy(): Promise<
    ActionResponse<IReferralResponse[]>
  > {
    try {
      await connectToDB();

      const key = this.getCacheKey("all");
      const cached = await CacheService.get<IReferralResponse[]>(key);
      if (cached) {
        return { success: true, message: "From cache", data: cached };
      }

      const referrals = await Referral.find({})
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 })
        .lean();

      const list = referrals.map(this.transformReferral);
      await CacheService.set(key, list, this.CACHE_TTL);

      return {
        success: true,
        message: "Referrals retrieved successfully",
        data: list,
      };
    } catch (error) {
      console.error("Get all referrals error:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to fetch referrals",
      };
    }
  }

  static async createReferral(
    data: Partial<IReferral>
  ): Promise<ActionResponse<IReferralResponse>> {
    try {
      await connectToDB();

      const referral = new Referral(data);
      await referral.save();

      const populated = await Referral.findById(referral._id)
        .populate("createdBy", "name email")
        .lean();

      const transformed = this.transformReferral(populated);

      // Invalidate relevant caches
      await this.invalidateAllCaches(data.vendorId!.toString());
      await CacheService.set(
        this.getCacheKey(referral._id.toString()),
        transformed,
        this.CACHE_TTL
      );

      return {
        success: true,
        message: "Referral created successfully",
        data: transformed,
      };
    } catch (error) {
      console.error("Create referral error:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to create referral",
      };
    }
  }

  static async getReferralById(
    id: string
  ): Promise<ActionResponse<IReferralResponse>> {
    try {
      await connectToDB();

      const key = this.getCacheKey(id);
      const cached = await CacheService.get<IReferralResponse>(key);
      if (cached) {
        return { success: true, message: "From cache", data: cached };
      }

      const referral = await Referral.findById(id)
        .populate("createdBy", "name email")
        .lean();

      if (!referral) {
        return { success: false, message: "Referral not found" };
      }

      const transformed = this.transformReferral(referral);
      await CacheService.set(key, transformed, this.CACHE_TTL);

      return {
        success: true,
        message: "Referral retrieved successfully",
        data: transformed,
      };
    } catch (error) {
      console.error("Get referral error:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to fetch referral",
      };
    }
  }

  static async getReferralStats(
    vendorId: string
  ): Promise<ActionResponse<IReferralStats>> {
    try {
      await connectToDB();

      const referrals = await Referral.find({ vendorId }).lean();

      const totalReferrals = referrals.length;
      const activeReferrals = referrals.filter((r) => r.isActive).length;
      const totalRewardPointsIssued = referrals.reduce(
        (sum, r) => sum + r.rewardPoints * r.usedCount,
        0
      );
      const totalUsageCount = referrals.reduce(
        (sum, r) => sum + r.usedCount,
        0
      );

      const monthlyUsage: Record<string, number> = {};
      for (const referral of referrals) {
        const month = new Date(referral.createdAt).toLocaleString("default", {
          month: "long",
          year: "numeric",
        });
        monthlyUsage[month] = (monthlyUsage[month] || 0) + referral.usedCount;
      }

      const stats: IReferralStats = {
        totalReferrals,
        activeReferrals,
        totalRewardPointsIssued,
        totalUsageCount,
        conversionRate:
          totalUsageCount > 0 ? (totalUsageCount / totalReferrals) * 100 : 0,
        monthlyUsage,
      };

      return {
        success: true,
        message: "Referral stats retrieved successfully",
        data: stats,
      };
    } catch (error) {
      console.error("Get referral stats error:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch referral stats",
      };
    }
  }

  static async applyReferral(
    code: string,
    userId: string
  ): Promise<ActionResponse> {
    try {
      await connectToDB();

      const referral = await Referral.findOne({
        code,
        isActive: true,
        expiryDate: { $gt: new Date() },
        $expr: { $lt: ["$usedCount", "$maxUses"] },
      }).lean<IReferral>();

      if (!referral) {
        return {
          success: false,
          message: "Referral code is invalid or expired",
        };
      }

      const user = await User.findById(userId);
      if (!user) {
        return {
          success: false,
          message: "User not found",
        };
      }

      if (user.referralUsed) {
        return {
          success: false,
          message: "User has already used a referral code",
        };
      }

      user.rewardPoints += referral.rewardPoints;
      user.referral = referral.code;
      user.referralUsed = true;
      await user.save();

      await Referral.findByIdAndUpdate(referral._id, {
        $inc: { usedCount: 1 },
      });

      // Invalidate relevant caches
      if (referral.vendorId) {
        await this.invalidateAllCaches(referral.vendorId.toString());
      }
      if (referral._id) {
        await CacheService.delete(this.getCacheKey(referral._id.toString()));
      }

      return {
        success: true,
        message: `Successfully applied referral code. ${referral.rewardPoints} points added to your account.`,
      };
    } catch (error) {
      console.error("Apply referral error:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to apply referral",
      };
    }
  }

  static async getReferralByCode(
    code: string
  ): Promise<ActionResponse<IReferralResponse>> {
    try {
      await connectToDB();

      const referral = await Referral.findOne({
        code,
        isActive: true,
        expiryDate: { $gt: new Date() },
      })
        .populate("createdBy", "name email")
        .lean();

      if (!referral) {
        return {
          success: false,
          message: "Referral code not found or expired",
        };
      }

      return {
        success: true,
        message: "Referral retrieved successfully",
        data: this.transformReferral(referral),
      };
    } catch (error) {
      console.error("Get referral by code error:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to fetch referral",
      };
    }
  }

  static async updateReferral(
    id: string,
    data: Partial<IReferral>
  ): Promise<ActionResponse<IReferralResponse>> {
    try {
      await connectToDB();

      const updateData = { ...data };
      const referral = await Referral.findByIdAndUpdate(
        id,
        { ...updateData },
        { new: true }
      )
        .populate("createdBy", "name email")
        .lean<IReferral>();

      if (!referral) {
        return { success: false, message: "Referral not found" };
      }

      const transformed = this.transformReferral(referral);

      // Invalidate relevant caches
      if (referral.vendorId) {
        await this.invalidateAllCaches(referral.vendorId.toString());
      }
      await CacheService.delete(this.getCacheKey(id));

      return {
        success: true,
        message: "Referral updated successfully",
        data: transformed,
      };
    } catch (error) {
      console.error("Update referral error:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to update referral",
      };
    }
  }

  static async deleteReferral(id: string): Promise<ActionResponse> {
    try {
      await connectToDB();

      const referral = await Referral.findByIdAndDelete<IReferral>(id).lean();

      if (!referral) {
        return { success: false, message: "Referral not found" };
      }

      // Invalidate relevant caches
      if (referral.vendorId) {
        await this.invalidateAllCaches(referral.vendorId.toString());
      }
      await CacheService.delete(this.getCacheKey(id));

      return {
        success: true,
        message: "Referral deleted successfully",
      };
    } catch (error) {
      console.error("Delete referral error:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to delete referral",
      };
    }
  }

  // Helper method to invalidate all relevant caches
  private static async invalidateAllCaches(vendorId: string): Promise<void> {
    try {
      // Invalidate vendor-specific list cache
      await CacheService.delete(this.listCacheKey(vendorId));

      // Invalidate admin cache
      await CacheService.delete(this.getCacheKey("all"));

      // Invalidate paginated caches (this is a simplified approach)
      // In production, you might want to use cache tagging or patterns
      const cacheKeys = await CacheService.keys(
        this.getCacheKey("paginated:*")
      );
      const adminCacheKeys = await CacheService.keys(
        this.getCacheKey("admin:paginated:*")
      );

      await Promise.all([
        ...cacheKeys.map((key) => CacheService.delete(key)),
        ...adminCacheKeys.map((key) => CacheService.delete(key)),
      ]);
    } catch (error) {
      console.error("Error invalidating caches:", error);
    }
  }

  private static transformReferral(referral: any): IReferralResponse {
    return {
      _id: referral._id.toString(),
      name: referral.name,
      description: referral.description,
      code: referral.code,
      rewardPoints: referral.rewardPoints,
      vendorId: referral.vendorId ? referral.vendorId.toString() : undefined,
      expiryDate: referral.expiryDate,
      maxUses: referral.maxUses,
      usedCount: referral.usedCount,
      isActive: referral.isActive,
      createdBy: referral.createdBy
        ? {
            _id: referral.createdBy._id.toString(),
            name: referral.createdBy.name,
            email: referral.createdBy.email,
          }
        : undefined,
      createdAt: referral.createdAt,
      updatedAt: referral.updatedAt,
    };
  }
}

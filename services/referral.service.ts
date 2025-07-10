/* eslint-disable @typescript-eslint/no-explicit-any */
import { connectToDB } from "@/lib/mongodb";
import Referral from "@/lib/models/referral.model";
import User from "@/lib/models/user.model";
import { CacheService } from "./cache.service";

export class ReferralService {
  private static CACHE_TTL = 300; // 5 minutes

  private static getCacheKey(id: string) {
    return `referrals:${id}`;
  }

  private static listCacheKey(vendorId: string) {
    return `referrals:list:${vendorId}`;
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

      // Invalidate and cache
      await CacheService.delete(this.listCacheKey(data.vendorId!.toString()));
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

      // Invalidate caches
      if (referral.vendorId) {
        await CacheService.delete(
          this.listCacheKey(referral.vendorId.toString())
        );
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
      // Invalidate caches
      if (referral.vendorId) {
        await CacheService.delete(
          this.listCacheKey(referral.vendorId.toString())
        );
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

  private static transformReferral(referral: any): IReferralResponse {
    return {
      _id: referral._id.toString(),
      name: referral.name,
      description: referral.description,
      code: referral.code,
      rewardPoints: referral.rewardPoints,
      vendorId: referral.vendorId.toString(),
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

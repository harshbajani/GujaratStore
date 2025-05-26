/* eslint-disable @typescript-eslint/no-explicit-any */
import { connectToDB } from "@/lib/mongodb";
import Referral from "@/lib/models/referral.model";
import User from "@/lib/models/user.model";

export class ReferralService {
  static async createReferral(
    data: Partial<IReferral>
  ): Promise<ActionResponse<IReferralResponse>> {
    try {
      await connectToDB();

      const referral = new Referral(data);
      await referral.save();

      const populatedReferral = await Referral.findById(referral._id)
        .populate("createdBy", "name email")
        .lean();

      return {
        success: true,
        message: "Referral created successfully",
        data: this.transformReferral(populatedReferral),
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

      const referral = await Referral.findById(id)
        .populate("createdBy", "name email")
        .lean();

      if (!referral) {
        return { success: false, message: "Referral not found" };
      }

      return {
        success: true,
        message: "Referral retrieved successfully",
        data: this.transformReferral(referral),
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

      const referrals = await Referral.find({ vendorId })
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 })
        .lean();

      return {
        success: true,
        message: "Referrals retrieved successfully",
        data: referrals.map(this.transformReferral),
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

      // Calculate monthly usage
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

      // Update user with reward points
      user.rewardPoints += referral.rewardPoints;
      user.referral = referral.code;
      user.referralUsed = true;
      await user.save();

      // Update referral usage count
      await Referral.findByIdAndUpdate(referral._id, {
        $inc: { usedCount: 1 },
      });

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

      // Remove _id from update data if present
      const { ...updateData } = data;

      const referral = await Referral.findByIdAndUpdate(
        id,
        { ...updateData },
        { new: true }
      )
        .populate("createdBy", "name email")
        .lean();

      if (!referral) {
        return { success: false, message: "Referral not found" };
      }

      return {
        success: true,
        message: "Referral updated successfully",
        data: this.transformReferral(referral),
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

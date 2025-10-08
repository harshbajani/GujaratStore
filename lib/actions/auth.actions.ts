"use server";

import { connectToDB } from "@/lib/mongodb";
import User from "@/lib/models/user.model";
import OTP from "@/lib/models/otp.model";
import { generateOTP, sendEmailOTP } from "@/lib/auth";

type SignUpData = {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: "user";
  referral?: string; // Add optional referral field
};

type ActionResponse = {
  success: boolean;
  message: string;
  data?: { tempUserId?: string };
};

// * Sign Up Action
export async function signUp(data: SignUpData): Promise<ActionResponse> {
  try {
    await connectToDB();

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email: data.email }, { phone: data.phone }],
    });
    if (existingUser) {
      return {
        success: false,
        message: "User already exists",
      };
    }

    // Generate OTP
    const otp = generateOTP();

    try {
      await sendEmailOTP(data.email, otp);
    } catch (emailError) {
      console.error("Failed to send OTP email:", emailError);
      return {
        success: false,
        message: "Failed to send OTP email. Please try again.",
      };
    }

    // Store OTP
    await OTP.create({ email: data.email, otp });

    // Handle referral and reward points
    let rewardPoints = 0;
    let referralMessage = "";

    if (data.referral) {
      try {
        const referralResponse = await fetch(
          `${process.env.NEXT_PUBLIC_APP_BASE_URL}/api/referrals?code=${data.referral}`
        );

        if (referralResponse.ok) {
          const referralData = await referralResponse.json();
          if (referralData.success && referralData.data) {
            // Get the reward points from the referral
            rewardPoints = referralData.data.rewardPoints;
            referralMessage = ` with ${rewardPoints} reward points`;
            console.log(
              "Valid referral found and points will be applied:",
              rewardPoints
            );
          }
        }
      } catch (error) {
        console.error("Error validating referral:", error);
      }
    }

    // Create user with referral code and reward points
    const user = await User.create({
      ...data,
      isVerified: false,
      rewardPoints: rewardPoints, // Add the reward points
      referral: data.referral, // Store the referral code
      referralUsed: data.referral ? true : false, // Mark referral as used
    });

    // If referral was used successfully, increment the usedCount in the referral
    if (data.referral) {
      await fetch(`${process.env.NEXT_PUBLIC_APP_BASE_URL}/api/referrals`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: data.referral,
          usedCount: { $inc: 1 }, // Increment usedCount by 1
        }),
      });
    }

    return {
      success: true,
      message: data.referral
        ? `User created successfully${referralMessage}. OTP sent to email.`
        : "User created successfully. OTP sent to email.",
      data: { tempUserId: user._id },
    };
  } catch (error) {
    console.error("Signup error:", error);
    return {
      success: false,
      message: "Internal server error",
    };
  }
}

// * Verify OTP Action
export async function verifyOTP(
  email: string,
  otp: string
): Promise<ActionResponse> {
  try {
    await connectToDB();

    const otpRecord = await OTP.findOne({ email, otp });
    if (!otpRecord) {
      return {
        success: false,
        message: "Invalid OTP",
      };
    }

    // Update user verification status WITHOUT overwriting other fields
    await User.updateOne(
      { email },
      {
        $set: { isVerified: true },
      }
    );

    // Delete OTP record
    await OTP.deleteOne({ email });

    // Send welcome email in background via Inngest
    try {
      const { inngest } = await import("@/lib/inngest/client");
      const user = await User.findOne({ email }).lean<IUser>();
      if (user) {
        await inngest.send({
          name: "app/user.welcome",
          data: {
            email: user.email,
            name: user.name,
          },
        });
      }
    } catch (e) {
      console.error("Failed to enqueue welcome email event:", e);
      // Do not block verification flow on email enqueue failure
    }

    return {
      success: true,
      message: "Email verified successfully",
    };
  } catch (error) {
    console.error("Verification error:", error);
    return {
      success: false,
      message: "Internal server error",
    };
  }
}

// * Resend OTP Action
export async function resendOTP(email: string): Promise<ActionResponse> {
  try {
    await connectToDB();

    // Generate new OTP
    const newOtp = generateOTP();

    // Update or create OTP record
    await OTP.findOneAndUpdate(
      { email },
      { otp: newOtp },
      { upsert: true, new: true }
    );

    // Send new OTP email
    await sendEmailOTP(email, newOtp);

    return {
      success: true,
      message: "OTP resent successfully",
    };
  } catch (error) {
    console.error("Error resending OTP:", error);
    return {
      success: false,
      message: "Failed to resend OTP",
    };
  }
}

// * Sign Out Action
export async function signOut(): Promise<ActionResponse> {
  return {
    success: true,
    message: "Signed out successfully",
  };
}

// * Reset Password intiation
export async function initiatePasswordReset(
  email: string
): Promise<ActionResponse> {
  try {
    await connectToDB();

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return {
        success: false,
        message: "No account found with this email address",
      };
    }

    // Generate OTP
    const otp = generateOTP();

    // Store OTP with expiration
    await OTP.findOneAndUpdate(
      { email },
      {
        otp,
        type: "password-reset",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      },
      { upsert: true, new: true }
    );

    // Send password reset email
    await sendEmailOTP(email, otp);

    return {
      success: true,
      message: "Password reset instructions sent to your email",
    };
  } catch (error) {
    console.error("Password reset initiation error:", error);
    return {
      success: false,
      message: "Failed to process password reset request",
    };
  }
}

// * Reset Password
export async function resetPassword(
  email: string,
  otp: string,
  newPassword: string
): Promise<ActionResponse> {
  try {
    await connectToDB();

    // Verify OTP
    const otpRecord = await OTP.findOne({
      email,
      otp,
      type: "password-reset",
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return {
        success: false,
        message: "Invalid or expired reset code",
      };
    }

    // Update password
    await User.updateOne({ email }, { password: newPassword });

    // Delete used OTP
    await OTP.deleteOne({ email, type: "password-reset" });

    return {
      success: true,
      message: "Password reset successfully",
    };
  } catch (error) {
    console.error("Password reset error:", error);
    return {
      success: false,
      message: "Failed to reset password",
    };
  }
}

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

    // Create user
    const user = await User.create({
      ...data,
      isVerified: false,
    });

    return {
      success: true,
      message: "User created successfully. OTP sent to email.",
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

    // Update user verification status
    await User.updateOne({ email }, { isVerified: true });

    // Delete OTP record
    await OTP.deleteOne({ email });

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

export async function signOut(): Promise<ActionResponse> {
  return {
    success: true,
    message: "Signed out successfully",
  };
}

export const forgotPassword = async (email: string) => {
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return { success: false, message: "No user found with this email" };
    }

    const resetToken = generateOTP();
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordTokenExpiry = resetTokenExpiry;
    await user.save();

    await sendEmailOTP(email, resetToken);

    return { success: true, message: "Reset password email sent" };
  } catch (error) {
    console.error("Forgot password error:", error);
    return { success: false, message: "Something went wrong" };
  }
};

export const resetPassword = async (
  email: string,
  token: string,
  newPassword: string
) => {
  try {
    const user = await User.findOne({
      email,
      resetPasswordToken: token,
      resetPasswordTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return { success: false, message: "Invalid or expired reset token" };
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpiry = undefined;
    await user.save();

    return { success: true, message: "Password reset successful" };
  } catch (error) {
    console.error("Reset password error:", error);
    return { success: false, message: "Something went wrong" };
  }
};

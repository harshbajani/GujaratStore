"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "./ui/input-otp";
import { Button } from "./ui/button";

interface OtpModalProps {
  email: string;
  type?: "verification" | "password-reset";
  role: "user" | "vendor";
  onVerified: (
    email: string,
    otp: string
  ) => Promise<{ success: boolean; message: string }>;
  onResendOTP: (
    email: string
  ) => Promise<{ success: boolean; message: string }>;
}

const OtpModal = ({
  email,
  type = "verification",
  role = "user",
  onVerified,
  onResendOTP,
}: OtpModalProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const router = useRouter();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else {
      setResendDisabled(false);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      setErrorMessage("Please enter the OTP");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const result = await onVerified(email, otp);

      if (result.success) {
        if (type === "password-reset" && role === "vendor") {
          router.push(`/vendor/reset-password?email=${email}&token=${otp}`);
        } else if (type === "password-reset" && role === "user") {
          router.push(`/reset-password?email=${email}&token=${otp}`);
        } else {
          router.push("/sign-in");
        }
      } else {
        setErrorMessage(result.message || "Invalid OTP. Please try again.");
      }
    } catch (error) {
      setErrorMessage("Something went wrong. Please try again.");
      console.error("Error during OTP verification:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setResendDisabled(true);
      setCountdown(30);

      const result = await onResendOTP(email); // Pass email parameter
      if (!result.success) {
        setErrorMessage("Failed to resend OTP. Please try again later.");
      }
    } catch (error) {
      setErrorMessage("Failed to resend OTP. Please try again later.");
      console.error("Error resending OTP:", error);
    }
  };

  const handleOtpChange = (newValue: string) => {
    const value = newValue.replace(/[^0-9]/g, ""); // Ensure only numeric values
    setOtp(value);
    setErrorMessage("");
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent className="sm:max-w-lg max-w-sm rounded-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-semibold">
            Enter Verification Code
          </AlertDialogTitle>
          <AlertDialogDescription className="subtitle-2 text-center text-light-100">
            We sent a verification code to
            <span className="pl-1 text-brand">{email}</span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <InputOTP value={otp} onChange={handleOtpChange} maxLength={6}>
          <InputOTPGroup className="shad-otp">
            <InputOTPSlot index={0} className="shad-otp-slot" />
            <InputOTPSlot index={1} className="shad-otp-slot" />
            <InputOTPSlot index={2} className="shad-otp-slot" />
            <InputOTPSlot index={3} className="shad-otp-slot" />
            <InputOTPSlot index={4} className="shad-otp-slot" />
            <InputOTPSlot index={5} className="shad-otp-slot" />
          </InputOTPGroup>
        </InputOTP>
        {errorMessage && (
          <p className="text-red-500 text-sm text-center">*{errorMessage}</p>
        )}

        <AlertDialogFooter>
          <div className="flex w-full flex-col gap-4">
            <AlertDialogAction
              onClick={handleSubmit}
              disabled={isLoading || !otp.trim()}
              className="shad-submit-btn h-12"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </div>
              ) : (
                "Verify"
              )}
            </AlertDialogAction>
            <div className="subtitle-2 mt-2 text-center text-light-100">
              <Button
                onClick={handleResendOTP}
                disabled={resendDisabled}
                variant="link"
                className="pl-1 text-brand"
              >
                {countdown > 0
                  ? `Resend OTP in ${countdown}s`
                  : "Resend verification code"}
              </Button>
            </div>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default OtpModal;

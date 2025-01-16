"use client";
import VendorResetPasswordForm from "@/lib/forms/vendorResetPasswordForm";
import { redirect } from "next/navigation";
import { useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const token = searchParams.get("token");

  if (!email || !token) {
    redirect("/vendor/forgot-password");
  }

  return <VendorResetPasswordForm email={email} token={token} />;
}

"use client";
import Loader from "@/components/Loader";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function withVendorProtection<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return function ProtectedRoute(props: P) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const [verificationStatus, setVerificationStatus] = useState<{
      isVerified: boolean;
      emailVerified: boolean;
      hasStore: boolean;
      hasBankDetails: boolean;
    } | null>(null);
    const [isLoadingVerification, setIsLoadingVerification] = useState(true);

    // Check verification status
    useEffect(() => {
      const checkVerificationStatus = async () => {
        if (status === "loading" || !session) return;

        try {
          const response = await fetch("/api/vendor/verification");
          const data = await response.json();

          if (data.success) {
            setVerificationStatus(data.data);
          }
        } catch (error) {
          console.error("Error checking verification status:", error);
        } finally {
          setIsLoadingVerification(false);
        }
      };

      checkVerificationStatus();
    }, [session, status]);

    useEffect(() => {
      if (status === "loading" || isLoadingVerification) return;

      if (!session) {
        router.replace("/vendor/sign-in");
      } else if (session.user.role !== "vendor") {
        router.replace("/vendor/unauthorized");
      } else if (verificationStatus && !verificationStatus.isVerified) {
        // Allow access to account page and verification pending page
        if (
          !pathname.includes("/vendor/account") &&
          !pathname.includes("/vendor/verification-pending")
        ) {
          router.replace("/vendor/verification-pending");
        }
      }
    }, [
      session,
      status,
      verificationStatus,
      isLoadingVerification,
      router,
      pathname,
    ]);

    if (status === "loading" || isLoadingVerification) {
      return (
        <div>
          <Loader />
        </div>
      );
    }

    if (!session || session.user.role !== "vendor") {
      return null;
    }

    // If not verified and trying to access protected routes, don't render
    if (
      verificationStatus &&
      !verificationStatus.isVerified &&
      !pathname.includes("/vendor/account") &&
      !pathname.includes("/vendor/verification-pending")
    ) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}

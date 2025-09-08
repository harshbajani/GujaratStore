import { useEffect, useState, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const useVendorAuth = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [verificationStatus, setVerificationStatus] = useState<{
    isVerified: boolean;
    emailVerified: boolean;
    hasStore: boolean;
    hasBankDetails: boolean;
  } | null>(null);

  const publicPaths = useMemo(
    () => [
      "/vendor/sign-in",
      "/vendor/sign-up",
      "/vendor/forgot-password",
      "/vendor/reset-password",
      "/vendor/account",
      "/vendor/verification-pending",
    ],
    []
  );

  // Check verification status
  useEffect(() => {
    const checkVerificationStatus = async () => {
      if (status === "loading" || !session || session.user.role !== "vendor")
        return;

      try {
        const response = await fetch("/api/vendor/verification");
        const data = await response.json();

        if (data.success) {
          setVerificationStatus(data.data);
        }
      } catch (error) {
        console.error("Error checking verification status:", error);
      }
    };

    checkVerificationStatus();
  }, [session, status]);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      // Allow access to public vendor paths
      if (publicPaths.includes(pathname)) return;

      // Redirect unauthenticated users to sign-in
      if (pathname.startsWith("/vendor")) {
        router.replace("/vendor/sign-in");
      }
    } else if (
      session.user.role === "vendor" &&
      pathname === "/vendor/sign-in"
    ) {
      // Check verification status before redirecting to dashboard
      if (verificationStatus) {
        if (!verificationStatus.isVerified) {
          router.replace("/vendor/verification-pending");
        } else if (!verificationStatus.hasStore) {
          router.replace("/vendor/account");
        } else {
          router.replace("/vendor/dashboard");
        }
      }
    } else if (
      session.user.role !== "vendor" &&
      pathname.startsWith("/vendor")
    ) {
      // Redirect users without the vendor role
      router.replace("/vendor/sign-in");
    } else if (
      session.user.role === "vendor" &&
      verificationStatus &&
      !verificationStatus.isVerified &&
      !pathname.includes("/vendor/account") &&
      !pathname.includes("/vendor/verification-pending")
    ) {
      // Redirect unverified vendors to verification pending page
      router.replace("/vendor/verification-pending");
    }
  }, [session, status, verificationStatus, router, pathname, publicPaths]);
};

export default useVendorAuth;

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const useVendorAuth = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const publicPaths = [
    "/vendor/sign-in",
    "/vendor/sign-up",
    "/vendor/forgot-password",
    "/vendor/reset-password",
  ];

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
      // Redirect authenticated vendor to dashboard
      router.replace("/vendor/dashboard");
    } else if (
      session.user.role !== "vendor" &&
      pathname.startsWith("/vendor")
    ) {
      // Redirect users without the vendor role
      router.replace("/vendor/sign-in");
    }
  }, [session, status, router]);
};

export default useVendorAuth;
